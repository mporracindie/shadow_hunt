import Phaser from 'phaser';
import { SocketManager } from '../multiplayer/SocketManager';

export interface PlayerOptions {
    name: string;
    role: 'Survivor' | 'Killer';
}

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };
    private movementTimer: number = 0;
    private runThreshold: number = 1000; // 1 second of walking before running
    private isRunning: boolean = false;
    private lastDirection: string = 'down'; // Track the last direction for idle state
    private playerLabel!: Phaser.GameObjects.Text;
    private socketManager!: SocketManager;
    private playerNumber: number = 0;
    private isDebugMode: boolean = true; // Set to true to enable debug visuals
    private debugGraphics!: Phaser.GameObjects.Graphics;
    private playerOptions: PlayerOptions = {
        name: 'Player',
        role: 'Survivor'
    };

    constructor() {
        super('GameScene');
    }

    init(data: any): void {
        // Get player options from previous scene
        if (data && data.playerOptions) {
            this.playerOptions = data.playerOptions;
        }
    }

    preload(): void {
        // Load skeleton warrior sprite sheets
        this.load.spritesheet('skeletonWalk', 'assets/skeleton_warrior/Walk.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        
        this.load.spritesheet('skeletonRun', 'assets/skeleton_warrior/Run.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        
        // Load skeleton spearman sprite sheets
        this.load.spritesheet('spearmanWalk', 'assets/skeleton_spearman/Walk.png', {
            frameWidth: 128,
            frameHeight: 128
        });
        
        this.load.spritesheet('spearmanRun', 'assets/skeleton_spearman/Run.png', {
            frameWidth: 128,
            frameHeight: 128
        });
    }

    create(): void {
        // Create debug graphics layer if debug mode is enabled
        if (this.isDebugMode) {
            this.debugGraphics = this.add.graphics();
            this.debugGraphics.setDepth(1000); // Make sure it's on top
        }

        // Create a plain colored background (light gray)
        this.cameras.main.setBackgroundColor('#cccccc');
        
        // Create a game area with fixed dimensions
        const gameWidth = 800;
        const gameHeight = 600;
        
        // Set camera and world bounds
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        // Create player based on role selection
        const spriteKey = this.playerOptions.role === 'Killer' ? 'skeletonWalk' : 'spearmanWalk';
        this.player = this.physics.add.sprite(gameWidth / 2, gameHeight / 2, spriteKey);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5); // Scale down the sprite if needed
        
        // Create player label - start with temporary text
        this.playerLabel = this.add.text(
            this.player.x,
            this.player.y - 50,
            this.playerOptions.name,
            {
                fontSize: '16px',
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        this.playerLabel.setOrigin(0.5);
        
        // Create animations for both character types
        this.createAnimations();
        
        // Set up input controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Set up WASD keys
        this.wasdKeys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Add debug key toggle
        if (this.isDebugMode) {
            this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D).on('down', () => {
                this.isDebugMode = !this.isDebugMode;
                this.debugGraphics.clear();
            });
        }
        
        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
        
        // Set initial animation
        const animPrefix = this.playerOptions.role === 'Killer' ? 'skeleton' : 'spearman';
        this.player.anims.play(`${animPrefix}_idle`);
        
        // Initialize socket manager for multiplayer BEFORE player setup completes
        this.socketManager = new SocketManager(this, this.playerOptions);
        
        // Listen for socket events to update our player number
        this.events.on('playerId', (playerNumber: number) => {
            this.playerNumber = playerNumber;
            this.playerLabel.setText(`${this.playerOptions.name} (${this.playerOptions.role})`);
            console.log("Updated local player label to:", `${this.playerOptions.name} (${this.playerOptions.role})`);
            
            // Also adjust color based on player role for consistency
            const roleColor = this.playerOptions.role === 'Killer' ? '#ff0000' : '#00ff00';
            this.playerLabel.setColor(roleColor);
        });
    }

    createAnimations(): void {
        // Create warrior animations
        this.anims.create({
            key: 'skeleton_walk',
            frames: this.anims.generateFrameNumbers('skeletonWalk', { start: 0, end: 6 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'skeleton_run',
            frames: this.anims.generateFrameNumbers('skeletonRun', { start: 0, end: 7 }),
            frameRate: 15,
            repeat: -1
        });
        
        this.anims.create({
            key: 'skeleton_idle',
            frames: [{ key: 'skeletonWalk', frame: 0 }],
            frameRate: 10
        });
        
        // Create spearman animations
        this.anims.create({
            key: 'spearman_walk',
            frames: this.anims.generateFrameNumbers('spearmanWalk', { start: 0, end: 6 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'spearman_run',
            frames: this.anims.generateFrameNumbers('spearmanRun', { start: 0, end: 7 }),
            frameRate: 15,
            repeat: -1
        });
        
        this.anims.create({
            key: 'spearman_idle',
            frames: [{ key: 'spearmanWalk', frame: 0 }],
            frameRate: 10
        });
    }

    update(time: number, delta: number): void {
        // Different movement speeds for Killer and Survivor
        const walkSpeed = this.playerOptions.role === 'Killer' ? 180 : 150;
        const runSpeed = this.playerOptions.role === 'Killer' ? 360 : 300;
        
        let isMoving = false;
        let moveSpeed = this.isRunning ? runSpeed : walkSpeed;
        
        // Horizontal movement
        if (this.cursors.left?.isDown || this.wasdKeys.A.isDown) {
            this.player.setVelocityX(-moveSpeed);
            // Flip sprite to face left
            this.player.setFlipX(true);
            isMoving = true;
        } else if (this.cursors.right?.isDown || this.wasdKeys.D.isDown) {
            this.player.setVelocityX(moveSpeed);
            // Reset flip for right direction
            this.player.setFlipX(false);
            isMoving = true;
        } else {
            this.player.setVelocityX(0);
        }
        
        // Vertical movement
        if (this.cursors.up?.isDown || this.wasdKeys.W.isDown) {
            this.player.setVelocityY(-moveSpeed);
            isMoving = true;
        } else if (this.cursors.down?.isDown || this.wasdKeys.S.isDown) {
            this.player.setVelocityY(moveSpeed);
            isMoving = true;
        } else {
            this.player.setVelocityY(0);
        }

        // Handle animations and movement state
        let currentAnimation = 'idle';
        const animPrefix = this.playerOptions.role === 'Killer' ? 'skeleton' : 'spearman';
        
        if (isMoving) {
            // Update movement timer when moving
            this.movementTimer += delta;
            
            // Switch to running after the threshold
            if (this.movementTimer >= this.runThreshold && !this.isRunning) {
                this.isRunning = true;
                currentAnimation = 'run';
                this.player.anims.play(`${animPrefix}_run`, true);
            } else if (!this.isRunning) {
                // Walking animation
                currentAnimation = 'walk';
                this.player.anims.play(`${animPrefix}_walk`, true);
            } else {
                currentAnimation = 'run';
            }
        } else {
            // Reset movement timer and running state when not moving
            this.movementTimer = 0;
            this.isRunning = false;
            
            // Idle animation
            currentAnimation = 'idle';
            this.player.anims.play(`${animPrefix}_idle`, true);
        }
        
        // Update player label position
        this.playerLabel.x = this.player.x;
        this.playerLabel.y = this.player.y - 50;
        
        // Send position update to the server, include player role for the movement speed
        this.socketManager.updatePlayerState(
            this.player.x,
            this.player.y,
            this.player.flipX,
            `${animPrefix}_${currentAnimation}`
        );
        
        // Update debug visuals if enabled
        if (this.isDebugMode) {
            this.updateDebugVisuals();
        }
    }
    
    private updateDebugVisuals(): void {
        // Clear previous frame
        this.debugGraphics.clear();
        
        // Draw a red circle at player position
        this.debugGraphics.fillStyle(0xff0000, 0.5);
        this.debugGraphics.fillCircle(this.player.x, this.player.y, 10);
        
        // Draw grid lines to help visualize the game area
        this.debugGraphics.lineStyle(1, 0xffffff, 0.2);
        
        // Vertical grid lines
        for (let x = 0; x < this.cameras.main.width; x += 50) {
            this.debugGraphics.lineBetween(
                x, 0,
                x, this.cameras.main.height
            );
        }
        
        // Horizontal grid lines
        for (let y = 0; y < this.cameras.main.height; y += 50) {
            this.debugGraphics.lineBetween(
                0, y,
                this.cameras.main.width, y
            );
        }
    }
    
    // Add a method to get the player for use by SocketManager
    public getPlayer(): Phaser.Physics.Arcade.Sprite {
        return this.player;
    }
    
    // Get player options
    public getPlayerOptions(): PlayerOptions {
        return this.playerOptions;
    }
    
    shutdown(): void {
        // Clean up when the scene is closed
        this.socketManager.disconnect();
    }
} 