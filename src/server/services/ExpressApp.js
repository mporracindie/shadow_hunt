const express = require('express');
const path = require('path');

class ExpressApp {
    constructor(config) {
        this.app = express();
        this.config = config;
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // Serve static files from the 'dist' directory
        this.app.use(express.static(path.join(__dirname, '../../../dist')));

        // Enable CORS for all Express routes
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }

    setupRoutes() {
        // In production, serve all requests with the game
        if (this.config.IS_PRODUCTION) {
            this.app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, '../../../dist/index.html'));
            });
        }
    }

    getApp() {
        return this.app;
    }
}

module.exports = ExpressApp; 