# 👁 Shadow Hunt

A 2D web-based game inspired by Dead by Daylight, built with Phaser.js and TypeScript.

## Game Features

- Skeleton warrior character with walking, running, and idle animations
- Four-directional movement using arrow keys or WASD
- Character automatically transitions to running after walking for 1 second
- Clean, minimal map design

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/shadow_hunt.git
cd shadow_hunt
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:8080`

## Game Controls

- **Arrow Keys** or **WASD**: Move in four directions
- Character will automatically start running after walking for 1 second
- Character returns to idle state when not moving

## Development

- **Build for development**: `npm run dev`
- **Build for production**: `npm run build`

## Features (Current Iteration)

- Basic canvas with background
- Simple tile-based map
- Character (Survivor) movement (left/right)

## Future Features

- Hunter character
- Stealth mechanics
- Objectives for survivors
- Win/lose conditions
- Multiplayer support 