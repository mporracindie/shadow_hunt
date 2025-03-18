const os = require('os');

// Server configuration
const config = {
    PORT: process.env.PORT || 3000,
    HOST: '0.0.0.0',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    
    // Socket.IO configuration
    socketIO: {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["my-custom-header"]
        }
    },
    
    // Get local IP address for easier connection on LAN
    getLocalIp() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return '127.0.0.1';
    }
};

module.exports = config; 