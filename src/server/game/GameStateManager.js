class GameStateManager {
    constructor() {
        this.players = {};
        this.nextPlayerId = 1;
    }

    createPlayer(socketId, playerData = {}) {
        const playerNumber = this.nextPlayerId++;
        const defaultName = `Player${playerNumber}`;
        const defaultRole = Math.random() > 0.5 ? 'Survivor' : 'Killer';
        
        const player = {
            id: socketId,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            flipX: false,
            animation: playerData.role === 'Killer' ? 'skeleton_idle' : 'spearman_idle',
            playerNumber: playerNumber,
            name: playerData.name || defaultName,
            role: playerData.role || defaultRole
        };
        
        this.players[socketId] = player;
        return player;
    }

    getPlayer(socketId) {
        return this.players[socketId];
    }

    getAllPlayers() {
        return this.players;
    }

    updatePlayerPosition(socketId, movementData) {
        if (this.players[socketId]) {
            this.players[socketId].x = movementData.x;
            this.players[socketId].y = movementData.y;
            this.players[socketId].flipX = movementData.flipX;
            this.players[socketId].animation = movementData.animation;
            
            // Update name and role if provided
            if (movementData.name) {
                this.players[socketId].name = movementData.name;
            }
            if (movementData.role) {
                this.players[socketId].role = movementData.role;
            }
            
            return this.players[socketId];
        }
        return null;
    }

    removePlayer(socketId) {
        const player = this.players[socketId];
        delete this.players[socketId];
        return player;
    }

    getPlayerCount() {
        return Object.keys(this.players).length;
    }

    logState() {
        console.log('Current players:', this.getPlayerCount());
        Object.keys(this.players).forEach(id => {
            const player = this.players[id];
            console.log(`- ${player.name} (${player.role}) at (${Math.floor(player.x)}, ${Math.floor(player.y)})`);
        });
    }
    
    getSurvivorsCount() {
        return Object.values(this.players).filter(p => p.role === 'Survivor').length;
    }
    
    getKillersCount() {
        return Object.values(this.players).filter(p => p.role === 'Killer').length;
    }
}

module.exports = GameStateManager; 