import { io, Socket } from 'socket.io-client';
import GameScene from '../scenes/GameScene';

export interface PlayerInfo {
    id: string;
    x: number;
    y: number;
    flipX: boolean;
    animation: string;
    playerNumber: number;
}

export class SocketManager {
    private socket: Socket;
    private gameScene: GameScene;
    private playerId: string | null = null;
    private otherPlayers: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
    private playerLabels: Map<string, Phaser.GameObjects.Text> = new Map();
    private debugText!: Phaser.GameObjects.Text;
    private playerPositionsText!: Phaser.GameObjects.Text;
    private isDebugMode: boolean = true;
    private playerColors: string[] = ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];

    constructor(gameScene: GameScene) {
        this.gameScene = gameScene;

        // Add debug text at the top left
        this.debugText = this.gameScene.add.text(20, 20, 'Connecting...', {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        });
        this.debugText.setDepth(100);
        this.debugText.setScrollFactor(0); // Fixed to camera
        
        // Add player positions text at the top right
        this.playerPositionsText = this.gameScene.add.text(
            this.gameScene.cameras.main.width - 20, 
            20, 
            'No players yet', 
            {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 },
                align: 'right'
            }
        );
        this.playerPositionsText.setOrigin(1, 0); // Align to top right
        this.playerPositionsText.setDepth(100);
        this.playerPositionsText.setScrollFactor(0); // Fixed to camera

        // Directly try connecting to server
        this.connect();
    }
    
    private connect(): void {
        // Determine server URL based on environment
        // In production, connect to the same host the game is served from
        // In development, connect to localhost:3000
        const isProduction = window.location.hostname !== 'localhost';
        const serverUrl = isProduction ? window.location.origin : 'http://localhost:3000';
        
        this.updateDebugText(`Connecting to server: ${serverUrl} (${isProduction ? 'production' : 'development'})`);
        
        // Configure socket options based on environment
        const options = {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        };
        
        // Create socket connection
        this.socket = io(serverUrl, options);
        
        this.socket.on('connect', () => {
            this.updateDebugText(`Connected! Socket ID: ${this.socket.id}`);
            
            // Force request for players after connection
            setTimeout(() => {
                console.log("Requesting players list from server");
                this.socket.emit('requestPlayers');
            }, 1000);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateDebugText(`Connection error: ${error.message}`);
            
            // If we're in production and get an error, try reconnecting
            if (isProduction) {
                this.updateDebugText('Retrying connection in 3 seconds...');
                setTimeout(() => {
                    this.updateDebugText('Retrying connection...');
                    this.socket.connect();
                }, 3000);
            }
        });

        this.setupSocketListeners();
    }

    private updateDebugText(message: string): void {
        console.log(`[SocketManager] ${message}`);
        if (this.debugText) {
            // Append to existing text, keeping only the last 5 lines
            const lines = this.debugText.text.split('\n');
            lines.push(message);
            if (lines.length > 5) lines.shift();
            this.debugText.setText(lines.join('\n'));
        }
    }
    
    private updatePlayerPositionsText(): void {
        if (!this.playerPositionsText) return;
        
        let text = `Local player: ${this.playerId?.substring(0, 6) || 'unknown'}\n`;
        text += `Total players: ${this.otherPlayers.size + 1}\n\n`;
        
        // Add local player position
        const localPlayer = this.gameScene.getPlayer();
        if (localPlayer) {
            text += `You: (${Math.floor(localPlayer.x)}, ${Math.floor(localPlayer.y)})\n`;
        }
        
        // Add other player positions
        this.otherPlayers.forEach((sprite, id) => {
            const label = this.playerLabels.get(id);
            const playerNumber = label ? label.text.replace('Player ', '') : '?';
            text += `P${playerNumber}: (${Math.floor(sprite.x)}, ${Math.floor(sprite.y)})\n`;
        });
        
        this.playerPositionsText.setText(text);
    }

    private setupSocketListeners(): void {
        // Get current player ID
        this.socket.on('currentPlayerId', (id: string) => {
            this.playerId = id;
            this.updateDebugText(`Your player ID: ${id}`);
        });

        // Add existing players
        this.socket.on('existingPlayers', (players: { [key: string]: PlayerInfo }) => {
            const playerCount = Object.keys(players).length;
            this.updateDebugText(`Found ${playerCount} players on server`);

            // Debug dump of players
            console.log("All players from server:", players);
            
            // Process our own player info first
            if (this.playerId && players[this.playerId]) {
                const myInfo = players[this.playerId];
                this.updateDebugText(`I am player ${myInfo.playerNumber}`);
                this.gameScene.events.emit('playerId', myInfo.playerNumber);
            }
            
            // Then process other players
            Object.keys(players).forEach((id) => {
                if (id !== this.playerId) {
                    this.updateDebugText(`Adding player ${players[id].playerNumber} (ID: ${id.substring(0, 6)})`);
                    this.addOtherPlayer(players[id]);
                }
            });
            
            // Update player positions display
            this.updatePlayerPositionsText();
        });

        // Add new player
        this.socket.on('newPlayer', (playerInfo: PlayerInfo) => {
            if (playerInfo.id === this.playerId) return; // Skip if it's us
            
            this.updateDebugText(`New player joined: ${playerInfo.playerNumber} (ID: ${playerInfo.id.substring(0, 6)})`);
            console.log("New player data:", playerInfo);
            this.addOtherPlayer(playerInfo);
            this.updatePlayerPositionsText();
        });

        // Update player movement
        this.socket.on('playerMoved', (playerInfo: PlayerInfo) => {
            if (playerInfo.id === this.playerId) return; // Skip if it's us
            
            // Only update debug text occasionally
            if (Math.random() < 0.01) {
                this.updateDebugText(`Player ${playerInfo.playerNumber} at (${Math.floor(playerInfo.x)}, ${Math.floor(playerInfo.y)})`);
            }
            
            this.updateOtherPlayer(playerInfo);
            this.updatePlayerPositionsText();
        });

        // Remove disconnected player
        this.socket.on('playerDisconnected', (id: string) => {
            this.updateDebugText(`Player disconnected: ${id.substring(0, 6)}`);
            this.removePlayer(id);
            this.updatePlayerPositionsText();
        });
    }

    private addOtherPlayer(playerInfo: PlayerInfo): void {
        // Check if player info is valid
        if (!playerInfo || !playerInfo.id) {
            console.error("Invalid player info received:", playerInfo);
            return;
        }
        
        // Don't add ourselves as an other player
        if (playerInfo.id === this.playerId) {
            console.log("Not adding local player as other player");
            return;
        }
        
        // Check if we already have this player
        if (this.otherPlayers.has(playerInfo.id)) {
            console.log(`Player ${playerInfo.playerNumber} already exists, updating`);
            this.updateOtherPlayer(playerInfo);
            return;
        }
        
        console.log(`Creating player ${playerInfo.playerNumber} sprite at (${Math.floor(playerInfo.x)}, ${Math.floor(playerInfo.y)})`);
        
        // Create sprite for the other player
        const otherPlayer = this.gameScene.physics.add.sprite(
            playerInfo.x,
            playerInfo.y,
            'skeletonWalk'
        );
        otherPlayer.setScale(0.5);
        otherPlayer.setFlipX(playerInfo.flipX);
        
        // Select color based on player number for consistency
        const colorIndex = (playerInfo.playerNumber - 1) % this.playerColors.length;
        const playerColor = this.playerColors[colorIndex];
        
        // Create text label with player number
        const label = this.gameScene.add.text(
            playerInfo.x,
            playerInfo.y - 50,
            `Player ${playerInfo.playerNumber}`,
            {
                fontSize: '16px',
                color: playerColor,
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        label.setOrigin(0.5);

        // Store references to the player sprite and label
        this.otherPlayers.set(playerInfo.id, otherPlayer);
        this.playerLabels.set(playerInfo.id, label);
        
        // Set animations
        otherPlayer.anims.play(playerInfo.animation);
        
        this.updateDebugText(`Added player ${playerInfo.playerNumber} at (${Math.floor(playerInfo.x)}, ${Math.floor(playerInfo.y)})`);
    }

    private updateOtherPlayer(playerInfo: PlayerInfo): void {
        // Don't update ourselves
        if (playerInfo.id === this.playerId) return;
        
        // Check if player info is valid
        if (!playerInfo || !playerInfo.id) {
            console.error("Invalid player info received for update:", playerInfo);
            return;
        }
        
        const otherPlayer = this.otherPlayers.get(playerInfo.id);
        const label = this.playerLabels.get(playerInfo.id);

        if (!otherPlayer || !label) {
            // Player doesn't exist yet - add them
            console.log(`Player ${playerInfo.playerNumber} not found, adding`);
            this.addOtherPlayer(playerInfo);
            return;
        }

        // Update position
        otherPlayer.x = playerInfo.x;
        otherPlayer.y = playerInfo.y;
        label.x = playerInfo.x;
        label.y = playerInfo.y - 50;

        // Update animation and flip
        otherPlayer.setFlipX(playerInfo.flipX);
        if (otherPlayer.anims && playerInfo.animation && 
            (!otherPlayer.anims.currentAnim || otherPlayer.anims.currentAnim.key !== playerInfo.animation)) {
            otherPlayer.anims.play(playerInfo.animation, true);
        }
    }

    private removePlayer(id: string): void {
        // Remove player sprite and label
        const player = this.otherPlayers.get(id);
        const label = this.playerLabels.get(id);

        if (player) {
            player.destroy();
            this.otherPlayers.delete(id);
        }

        if (label) {
            label.destroy();
            this.playerLabels.delete(id);
        }
        
        this.updateDebugText(`Removed player. Total players: ${this.otherPlayers.size + 1}`);
    }

    public updatePlayerState(x: number, y: number, flipX: boolean, animation: string): void {
        // Only send updates if we have our own ID (connected)
        if (this.playerId) {
            this.socket.emit('playerMovement', {
                x,
                y,
                flipX,
                animation
            });
            
            // Update player positions display
            this.updatePlayerPositionsText();
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
    
    public getPlayerCount(): number {
        return this.otherPlayers.size + 1; // +1 for local player
    }
} 