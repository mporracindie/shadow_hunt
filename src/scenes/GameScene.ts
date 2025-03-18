import Phaser from 'phaser';

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

    constructor() {
        super('GameScene');
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
    }

    create(): void {
        // Create a plain colored background (light gray)
        this.cameras.main.setBackgroundColor('#cccccc');
        
        // Create a game area with fixed dimensions
        const gameWidth = 800;
        const gameHeight = 600;
        
        // Set camera and world bounds
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.physics.world.setBounds(0, 0, gameWidth, gameHeight);

        // Create player (skeleton warrior)
        this.player = this.physics.add.sprite(gameWidth / 2, gameHeight / 2, 'skeletonWalk');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.5); // Scale down the sprite if needed
        
        // Simple walking animation (all frames in the spritesheet)
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('skeletonWalk', { start: 0, end: 6 }), // Assuming 7 frames (0-6)
            frameRate: 10,
            repeat: -1
        });
        
        // Simple running animation (all frames in the spritesheet)
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('skeletonRun', { start: 0, end: 7 }), // Assuming 8 frames (0-7)
            frameRate: 15,
            repeat: -1
        });
        
        // Simple idle animation (just first frame of walk)
        this.anims.create({
            key: 'idle',
            frames: [{ key: 'skeletonWalk', frame: 0 }],
            frameRate: 10
        });
        
        // Set up input controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Set up WASD keys
        this.wasdKeys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };
        
        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.5, 0.5);
        
        // Set initial animation
        this.player.anims.play('idle');
    }

    update(time: number, delta: number): void {
        // Handle movement with arrow keys or WASD
        const walkSpeed = 150;
        const runSpeed = 300; // Running is faster
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
        if (isMoving) {
            // Update movement timer when moving
            this.movementTimer += delta;
            
            // Switch to running after the threshold
            if (this.movementTimer >= this.runThreshold && !this.isRunning) {
                this.isRunning = true;
                this.player.anims.play('run', true);
            } else if (!this.isRunning) {
                // Walking animation
                this.player.anims.play('walk', true);
            }
        } else {
            // Reset movement timer and running state when not moving
            this.movementTimer = 0;
            this.isRunning = false;
            
            // Idle animation
            this.player.anims.play('idle', true);
        }
    }
} 