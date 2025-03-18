const fs = require('fs');
const https = require('https');
const path = require('path');

// Create directories if they don't exist
const assetsDir = path.join(__dirname, 'src', 'assets', 'images');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// URLs for placeholder images
const urls = {
    player: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/sprites/dude.png',
    tiles: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/tilemaps/tiles/platformer_tiles.png'
};

// Download function
function downloadFile(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        
        https.get(url, (response) => {
            response.pipe(file);
            
            file.on('finish', () => {
                file.close(resolve);
                console.log(`Downloaded: ${outputPath}`);
            });
            
            file.on('error', (err) => {
                fs.unlink(outputPath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlink(outputPath, () => {});
            reject(err);
        });
    });
}

// Download all assets
async function downloadAssets() {
    try {
        await Promise.all([
            downloadFile(urls.player, path.join(assetsDir, 'player.png')),
            downloadFile(urls.tiles, path.join(assetsDir, 'tiles.png'))
        ]);
        console.log('All assets downloaded successfully!');
    } catch (error) {
        console.error('Error downloading assets:', error);
    }
}

downloadAssets(); 