import Phaser from 'phaser';
import { PlayerOptions } from './GameScene';

export default class TitleScene extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private subtitleText!: Phaser.GameObjects.Text;
    private nameInput!: HTMLInputElement;
    private startButton!: Phaser.GameObjects.Text;
    private survivorButton!: Phaser.GameObjects.Text;
    private killerButton!: Phaser.GameObjects.Text;
    private nameLabel!: Phaser.GameObjects.Text;
    private roleLabel!: Phaser.GameObjects.Text;
    private gameContainer!: Phaser.GameObjects.Container;
    
    private selectedRole: 'Survivor' | 'Killer' = 'Survivor';
    private playerName: string = 'Player';

    constructor() {
        super('TitleScene');
    }

    create(): void {
        // Get the actual game dimensions
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // Create a dark gradient background
        this.createBackgroundGradient();
        
        // Add decorative elements
        this.createDecorations();
        
        // Create a subtle glow effect behind the title
        const titleGlow = this.add.ellipse(
            gameWidth / 2,
            90,
            500,
            120,
            0x0000ff,
            0.1
        );
        
        // Add title with enhanced shadow
        this.titleText = this.add.text(
            gameWidth / 2,
            80,
            'SHADOW HUNT',
            {
                fontSize: '64px',
                color: '#ffffff',
                fontStyle: 'bold',
                fontFamily: 'Arial, sans-serif',
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: '#000000',
                    blur: 8,
                    fill: true
                },
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            }
        );
        this.titleText.setOrigin(0.5);
        
        // Add a second shadow text for double shadow effect
        const shadowText = this.add.text(
            gameWidth / 2 + 4,
            84,
            'SHADOW HUNT',
            {
                fontSize: '64px',
                color: '#000000',
                fontStyle: 'bold',
                fontFamily: 'Arial, sans-serif',
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                }
            }
        );
        shadowText.setOrigin(0.5);
        shadowText.setAlpha(0.3);
        shadowText.setDepth(this.titleText.depth - 1);
        
        // Create a container for UI elements
        this.gameContainer = this.add.container(0, 0);
        
        // Add a more stylish semi-transparent panel behind the UI elements
        // First, create a darker outer panel for a border effect
        const outerPanel = this.add.rectangle(
            gameWidth / 2,
            310,
            420,
            360,
            0x000022,
            0.7
        );
        outerPanel.setStrokeStyle(1, 0x0066aa);
        outerPanel.setOrigin(0.5, 0.5);
        this.gameContainer.add(outerPanel);
        
        // Then create the inner panel
        const panel = this.add.rectangle(
            gameWidth / 2,
            310,
            400,
            340,
            0x000033,
            0.6
        );
        panel.setOrigin(0.5, 0.5);
        this.gameContainer.add(panel);
        
        // Create name label
        this.nameLabel = this.add.text(
            gameWidth / 2, 
            200,
            'ENTER YOUR NAME:',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        this.nameLabel.setOrigin(0.5);
        this.gameContainer.add(this.nameLabel);
        
        // Create HTML input for player name
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.style.position = 'absolute';
        
        // Center the input element
        const canvas = this.sys.game.canvas;
        const canvasBounds = canvas.getBoundingClientRect();
        
        this.nameInput.style.width = '260px';
        this.nameInput.style.padding = '12px';
        this.nameInput.style.fontSize = '18px';
        this.nameInput.style.textAlign = 'center';
        this.nameInput.style.border = '2px solid #444444';
        this.nameInput.style.borderRadius = '5px';
        this.nameInput.style.backgroundColor = '#222222';
        this.nameInput.style.color = '#ffffff';
        this.nameInput.style.outline = 'none';
        this.nameInput.maxLength = 12;
        this.nameInput.value = this.playerName;
        
        // Calculate centered position
        const inputWidth = 260;
        const left = canvasBounds.left + (canvasBounds.width - inputWidth) / 2;
        const top = canvasBounds.top + 250;
        
        this.nameInput.style.left = `${left}px`;
        this.nameInput.style.top = `${top}px`;
        
        // Add input to the DOM
        document.body.appendChild(this.nameInput);
        
        // Create role selection label
        this.roleLabel = this.add.text(
            gameWidth / 2, 
            320,
            'SELECT YOUR ROLE:',
            {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        this.roleLabel.setOrigin(0.5);
        this.gameContainer.add(this.roleLabel);
        
        // Create Survivor button
        this.survivorButton = this.add.text(
            gameWidth / 2 - 100, 
            370,
            'Survivor',
            {
                fontSize: '24px',
                color: '#00ff00',
                backgroundColor: '#333333',
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                },
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 4,
                    fill: true
                }
            }
        );
        this.survivorButton.setOrigin(0.5);
        this.survivorButton.setInteractive({ useHandCursor: true });
        this.gameContainer.add(this.survivorButton);
        
        // Create Killer button
        this.killerButton = this.add.text(
            gameWidth / 2 + 100, 
            370,
            'Killer',
            {
                fontSize: '24px',
                color: '#ff0000',
                backgroundColor: '#333333',
                padding: {
                    left: 20,
                    right: 20,
                    top: 10,
                    bottom: 10
                },
                shadow: {
                    offsetX: 2,
                    offsetY: 2,
                    color: '#000000',
                    blur: 4,
                    fill: true
                }
            }
        );
        this.killerButton.setOrigin(0.5);
        this.killerButton.setInteractive({ useHandCursor: true });
        this.gameContainer.add(this.killerButton);
        
        // Create start button
        this.startButton = this.add.text(
            gameWidth / 2, 
            450,
            'START GAME',
            {
                fontSize: '32px',
                color: '#ffffff',
                backgroundColor: '#006600',
                padding: {
                    left: 25,
                    right: 25,
                    top: 12,
                    bottom: 12
                },
                shadow: {
                    offsetX: 3,
                    offsetY: 3,
                    color: '#000000',
                    blur: 5,
                    fill: true
                }
            }
        );
        this.startButton.setOrigin(0.5);
        this.startButton.setInteractive({ useHandCursor: true });
        this.gameContainer.add(this.startButton);
        
        // Highlight initial selected role
        this.updateRoleSelection();
        
        // Add event listeners
        this.survivorButton.on('pointerdown', () => {
            this.selectedRole = 'Survivor';
            this.updateRoleSelection();
        });
        
        this.killerButton.on('pointerdown', () => {
            this.selectedRole = 'Killer';
            this.updateRoleSelection();
        });
        
        this.survivorButton.on('pointerover', () => {
            this.survivorButton.setStyle({ backgroundColor: this.selectedRole === 'Survivor' ? '#007700' : '#444444' });
        });
        
        this.survivorButton.on('pointerout', () => {
            this.survivorButton.setStyle({ backgroundColor: this.selectedRole === 'Survivor' ? '#005500' : '#333333' });
        });
        
        this.killerButton.on('pointerover', () => {
            this.killerButton.setStyle({ backgroundColor: this.selectedRole === 'Killer' ? '#770000' : '#444444' });
        });
        
        this.killerButton.on('pointerout', () => {
            this.killerButton.setStyle({ backgroundColor: this.selectedRole === 'Killer' ? '#550000' : '#333333' });
        });
        
        this.startButton.on('pointerover', () => {
            this.startButton.setStyle({ backgroundColor: '#008800' });
        });
        
        this.startButton.on('pointerout', () => {
            this.startButton.setStyle({ backgroundColor: '#006600' });
        });
        
        this.startButton.on('pointerdown', () => {
            this.playerName = this.nameInput.value.trim() || 'Player';
            this.startGame();
        });
        
        // Handle keyboard enter to start game
        this.input.keyboard.on('keydown-ENTER', () => {
            this.playerName = this.nameInput.value.trim() || 'Player';
            this.startGame();
        });
        
        // Create a subtle pulsing animation for the start button
        this.tweens.add({
            targets: this.startButton,
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Create a resize listener to maintain input position
        window.addEventListener('resize', this.resizeHandler.bind(this));
    }
    
    private createBackgroundGradient(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create a gradient from dark blue to black that covers the entire screen
        const graphics = this.add.graphics();
        
        // Darker background to ensure full coverage
        graphics.fillStyle(0x000011, 1);
        graphics.fillRect(0, 0, width, height);
        
        // Add a radial gradient for a more dramatic effect
        const gradientRadius = Math.max(width, height) * 0.8;
        
        // Add a "spotlight" effect at the top
        const gradient = this.add.graphics();
        for (let i = 0; i < 10; i++) {
            const alpha = 0.05 - (i * 0.005);
            const radius = (gradientRadius / 10) * (i + 1);
            
            gradient.fillStyle(0x0000aa, alpha);
            gradient.fillCircle(width / 2, 100, radius);
        }
        
        // Add some atmospheric fog/mist
        for (let i = 0; i < 5; i++) {
            const y = height * 0.2 * i;
            const alpha = 0.05 - (i * 0.01);
            
            const fog = this.add.graphics();
            fog.fillStyle(0x000066, alpha);
            fog.fillRect(0, y, width, height * 0.3);
        }
    }
    
    private createDecorations(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create stars in the background
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1.0);
            
            const star = this.add.rectangle(x, y, size, size, 0xffffff, alpha);
            
            // Add a subtle twinkling effect
            this.tweens.add({
                targets: star,
                alpha: { from: alpha, to: 0.1 },
                duration: Phaser.Math.Between(1000, 5000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
    
    private resizeHandler(): void {
        // Recalculate input position after window resize
        if (this.nameInput && document.body.contains(this.nameInput)) {
            const canvas = this.sys.game.canvas;
            const canvasBounds = canvas.getBoundingClientRect();
            
            const inputWidth = 260;
            const left = canvasBounds.left + (canvasBounds.width - inputWidth) / 2;
            const top = canvasBounds.top + 250;
            
            this.nameInput.style.left = `${left}px`;
            this.nameInput.style.top = `${top}px`;
        }
    }
    
    private updateRoleSelection(): void {
        // Update button styles based on selection
        if (this.selectedRole === 'Survivor') {
            this.survivorButton.setStyle({ backgroundColor: '#005500' });
            this.killerButton.setStyle({ backgroundColor: '#333333' });
        } else {
            this.survivorButton.setStyle({ backgroundColor: '#333333' });
            this.killerButton.setStyle({ backgroundColor: '#550000' });
        }
    }
    
    private startGame(): void {
        // Create player options
        const playerOptions: PlayerOptions = {
            name: this.playerName,
            role: this.selectedRole
        };
        
        // Remove input element before changing scene
        if (document.body.contains(this.nameInput)) {
            document.body.removeChild(this.nameInput);
        }
        
        // Remove event listener
        window.removeEventListener('resize', this.resizeHandler.bind(this));
        
        // Start the game with player options
        this.scene.start('GameScene', { playerOptions });
    }
    
    shutdown(): void {
        // Clean up when scene is closed
        if (document.body.contains(this.nameInput)) {
            document.body.removeChild(this.nameInput);
        }
        
        // Remove event listener
        window.removeEventListener('resize', this.resizeHandler.bind(this));
    }
} 