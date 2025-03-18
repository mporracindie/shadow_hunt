const http = require('http');
const socketIO = require('socket.io');
const config = require('./src/server/config/server-config');
const ExpressApp = require('./src/server/services/ExpressApp');
const SocketManager = require('./src/server/services/SocketManager');

// Initialize Express app
const expressApp = new ExpressApp(config);
const app = expressApp.getApp();

// Create HTTP server
const server = http.Server(app);

// Initialize Socket.IO
const io = socketIO(server, config.socketIO);

// Initialize Socket Manager
const socketManager = new SocketManager(io);

// Handle socket connections
io.on('connection', (socket) => {
    socketManager.handleConnection(socket);
});

// Start the server
server.listen(config.PORT, config.HOST, () => {
    const localIp = config.getLocalIp();
    console.log(`Server running at:`);
    console.log(`- Local:   http://localhost:${config.PORT}`);
    console.log(`- Network: http://${localIp}:${config.PORT}`);
    
    if (!config.IS_PRODUCTION) {
        console.log(`\nGame client should be running at:`);
        console.log(`- Local:   http://localhost:8080`);
        console.log(`- Network: http://${localIp}:8080`);
    }
    
    console.log('\nEnvironment:', config.IS_PRODUCTION ? 'Production' : 'Development');
}); 