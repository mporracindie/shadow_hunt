const GameStateManager = require('../game/GameStateManager');

class SocketManager {
    constructor(io) {
        this.io = io;
        this.gameState = new GameStateManager();
        this.setupPeriodicStateLogging();
    }

    setupPeriodicStateLogging() {
        setInterval(() => {
            if (this.gameState.getPlayerCount() > 0) {
                console.log('\n--- Server Status Update ---');
                this.gameState.logState();
                console.log(`Survivors: ${this.gameState.getSurvivorsCount()}, Killers: ${this.gameState.getKillersCount()}`);
            }
        }, 30000); // Every 30 seconds
    }

    handleConnection(socket) {
        console.log('A user connected with ID:', socket.id);
        
        // Create new player - initially without name/role
        const player = this.gameState.createPlayer(socket.id);
        
        // Send the current player's ID to the new player
        socket.emit('currentPlayerId', socket.id);
        
        // Wait a short time to make sure clients are ready
        setTimeout(() => {
            // Send the existing players to the new player
            socket.emit('existingPlayers', this.gameState.getAllPlayers());
            
            // Notify all other players of the new player
            socket.broadcast.emit('newPlayer', player);
            
            // Log server state after connection
            this.gameState.logState();
        }, 500);

        this.setupSocketListeners(socket);
    }

    setupSocketListeners(socket) {
        // Handle explicit request for players (useful for reconnections)
        socket.on('requestPlayers', (playerData) => {
            console.log(`Player ${socket.id} requested player list with data:`, playerData);
            
            // Make sure the player is registered if this is a reconnection
            if (!this.gameState.getPlayer(socket.id)) {
                console.log(`Re-registering player ${socket.id} as ${playerData.name} (${playerData.role})`);
                const player = this.gameState.createPlayer(socket.id, playerData);
                socket.broadcast.emit('newPlayer', player);
            } else {
                // Update existing player with the provided data
                const player = this.gameState.getPlayer(socket.id);
                if (playerData.name) player.name = playerData.name;
                if (playerData.role) {
                    player.role = playerData.role;
                    // Update animation based on new role
                    player.animation = playerData.role === 'Killer' ? 'skeleton_idle' : 'spearman_idle';
                }
                socket.broadcast.emit('newPlayer', player);
            }
            
            // Send complete player list
            socket.emit('existingPlayers', this.gameState.getAllPlayers());
            this.gameState.logState();
        });
        
        // Handle player movement updates
        socket.on('playerMovement', (movementData) => {
            const updatedPlayer = this.gameState.updatePlayerPosition(socket.id, movementData);
            if (updatedPlayer) {
                // Emit updated player movement to all other players
                socket.broadcast.emit('playerMoved', updatedPlayer);
                
                // Log occasional movement for debugging
                if (Math.random() < 0.001) {
                    console.log(`${updatedPlayer.name} (${updatedPlayer.role}) moved to (${Math.floor(movementData.x)}, ${Math.floor(movementData.y)})`);
                }
            }
        });
        
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            
            // Get player info for logging
            const player = this.gameState.getPlayer(socket.id);
            if (player) {
                console.log(`${player.name} (${player.role}) has disconnected`);
            }
            
            // Remove player and notify others
            this.gameState.removePlayer(socket.id);
            this.io.emit('playerDisconnected', socket.id);
            
            // Log server state after disconnection
            this.gameState.logState();
        });
    }
}

module.exports = SocketManager; 