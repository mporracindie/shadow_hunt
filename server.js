const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const os = require('os');

const app = express();
const server = http.Server(app);

// In development, we're running on a different port than webpack-dev-server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Socket.io setup with CORS for development
const io = socketIO(server, {
    cors: {
        origin: "*", // Allow all origins to make testing easier
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["my-custom-header"]
    }
});

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Enable CORS for all Express routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Get local IP address for easier connection on LAN
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (loopback) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost
}

// Store connected players
const players = {};
let nextPlayerId = 1;

// Debug function to log server state
function logServerState() {
    console.log('Current players:', Object.keys(players).length);
    Object.keys(players).forEach(id => {
        const player = players[id];
        console.log(`- Player ${player.playerNumber} (${id}) at (${Math.floor(player.x)}, ${Math.floor(player.y)})`);
    });
}

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected with ID:', socket.id);
    
    // Assign a player number/name
    const playerNumber = nextPlayerId++;
    
    // Create a new player and add to the players object
    players[socket.id] = {
        id: socket.id,
        x: Math.floor(Math.random() * 700) + 50, // Random starting position
        y: Math.floor(Math.random() * 500) + 50,
        flipX: false,
        animation: 'idle',
        playerNumber: playerNumber
    };
    
    // Send the current player's ID to the new player
    socket.emit('currentPlayerId', socket.id);
    
    // Wait a short time to make sure clients are ready
    setTimeout(() => {
        // Send the existing players to the new player
        socket.emit('existingPlayers', players);
        
        // Notify all other players of the new player
        socket.broadcast.emit('newPlayer', players[socket.id]);
        
        // Log server state after connection
        logServerState();
    }, 500);
    
    // Handle explicit request for players (useful for reconnections)
    socket.on('requestPlayers', () => {
        console.log(`Player ${socket.id} requested player list`);
        
        // Make sure the player is registered if this is a reconnection
        if (!players[socket.id]) {
            console.log(`Re-registering player ${socket.id}`);
            players[socket.id] = {
                id: socket.id,
                x: Math.floor(Math.random() * 700) + 50,
                y: Math.floor(Math.random() * 500) + 50,
                flipX: false,
                animation: 'idle',
                playerNumber: nextPlayerId++
            };
            
            // Inform others of new player
            socket.broadcast.emit('newPlayer', players[socket.id]);
        }
        
        // Send complete player list
        socket.emit('existingPlayers', players);
        logServerState();
    });
    
    // Handle player movement updates
    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].flipX = movementData.flipX;
            players[socket.id].animation = movementData.animation;
            
            // Emit updated player movement to all other players
            socket.broadcast.emit('playerMoved', players[socket.id]);
            
            // Log occasional movement for debugging
            if (Math.random() < 0.001) {
                console.log(`Player ${players[socket.id].playerNumber} moved to (${Math.floor(movementData.x)}, ${Math.floor(movementData.y)})`);
            }
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove player from the players object
        delete players[socket.id];
        
        // Notify all other players that this player has left
        io.emit('playerDisconnected', socket.id);
        
        // Log server state after disconnection
        logServerState();
    });
});

// Periodic log of server state
setInterval(() => {
    if (Object.keys(players).length > 0) {
        console.log('\n--- Server Status Update ---');
        logServerState();
    }
}, 30000); // Every 30 seconds

// Start the server
server.listen(PORT, HOST, () => {
    const localIp = getLocalIp();
    console.log(`Server running at:`);
    console.log(`- Local:   http://localhost:${PORT}`);
    console.log(`- Network: http://${localIp}:${PORT}`);
    
    console.log(`\nGame client should be running at:`);
    console.log(`- Local:   http://localhost:8080`);
    console.log(`- Network: http://${localIp}:8080`);
    
    console.log('\nCurrent players:', Object.keys(players).length);
}); 