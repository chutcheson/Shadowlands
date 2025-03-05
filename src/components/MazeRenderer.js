import { CELL, COLORS, SETTINGS } from '../constants.js';

export class MazeRenderer {
    constructor(canvas, mazeGenerator) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mazeGenerator = mazeGenerator;
        this.cellSize = SETTINGS.CELL_SIZE;
        this.wallThickness = SETTINGS.WALL_THICKNESS;
        this.playerSize = SETTINGS.PLAYER_SIZE;
        
        this.resizeCanvas();
    }

    resizeCanvas() {
        // Set canvas dimensions based on maze size
        const width = this.mazeGenerator.width * this.cellSize;
        const height = this.mazeGenerator.height * this.cellSize;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Set pixel art rendering mode
        this.ctx.imageSmoothingEnabled = false;
    }

    clearCanvas() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCell(x, y, isVisible = true, isStart = false, isExit = false) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        // Draw cell background with cel-shaded effect
        if (isVisible) {
            // Base color
            let baseColor;
            if (isExit) {
                baseColor = COLORS.EXIT;
            } else if (isStart) {
                baseColor = COLORS.START;
            } else {
                baseColor = COLORS.FLOOR;
            }
            
            // Draw full cell without walls/borders
            this.ctx.fillStyle = baseColor;
            this.ctx.fillRect(
                cellX, 
                cellY, 
                this.cellSize, 
                this.cellSize
            );
            
            // Add darker edge to create cel-shaded look (but not on the outer edges)
            this.ctx.fillStyle = this.getDarkerColor(baseColor);
            this.ctx.fillRect(
                cellX + this.cellSize * 0.8, 
                cellY, 
                this.cellSize * 0.2, 
                this.cellSize
            );
            this.ctx.fillRect(
                cellX, 
                cellY + this.cellSize * 0.8, 
                this.cellSize, 
                this.cellSize * 0.2
            );
            
            // Add highlight for more dramatic cel-shading
            if (isExit) {
                // Add glow effect for exit
                this.ctx.fillStyle = this.getLighterColor(baseColor);
                this.ctx.fillRect(
                    cellX, 
                    cellY, 
                    this.cellSize * 0.3, 
                    this.cellSize * 0.3
                );
            }
        } else {
            this.ctx.fillStyle = COLORS.FOG;
            this.ctx.fillRect(
                cellX, 
                cellY, 
                this.cellSize, 
                this.cellSize
            );
        }
    }
    
    // Helper function to get a darker version of a color for cell shading
    getDarkerColor(hexColor) {
        // Convert hex to RGB
        let r = parseInt(hexColor.slice(1, 3), 16);
        let g = parseInt(hexColor.slice(3, 5), 16);
        let b = parseInt(hexColor.slice(5, 7), 16);
        
        // Make darker
        r = Math.max(0, r - 40);
        g = Math.max(0, g - 40);
        b = Math.max(0, b - 40);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    // Helper function to get a lighter version of a color for cell shading
    getLighterColor(hexColor) {
        // Convert hex to RGB
        let r = parseInt(hexColor.slice(1, 3), 16);
        let g = parseInt(hexColor.slice(3, 5), 16);
        let b = parseInt(hexColor.slice(5, 7), 16);
        
        // Make lighter
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 40);
        b = Math.min(255, b + 40);
        
        // Convert back to hex
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    drawPlayer(x, y) {
        const centerX = (x + 0.5) * this.cellSize;
        const centerY = (y + 0.5) * this.cellSize;
        
        // Draw player with cel-shaded effect
        const baseSize = this.playerSize / 2;
        
        // Main body
        this.ctx.fillStyle = COLORS.PLAYER;
        this.ctx.beginPath();
        this.ctx.arc(
            centerX, 
            centerY, 
            baseSize, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Highlight (cel-shading)
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.arc(
            centerX + baseSize * 0.3, 
            centerY + baseSize * 0.3, 
            baseSize * 0.6, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Light reflection
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(
            centerX - baseSize * 0.3, 
            centerY - baseSize * 0.3, 
            baseSize * 0.3, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
    }

    render(playerPosition) {
        this.clearCanvas();
        
        // Update visibility based on player position
        this.mazeGenerator.updateVisibility(playerPosition.x, playerPosition.y);
        
        // Draw all cells
        for (let y = 0; y < this.mazeGenerator.height; y++) {
            for (let x = 0; x < this.mazeGenerator.width; x++) {
                const isVisible = this.mazeGenerator.isVisible(x, y);
                const isStart = x === this.mazeGenerator.start.x && y === this.mazeGenerator.start.y;
                const isExit = x === this.mazeGenerator.exit.x && y === this.mazeGenerator.exit.y;
                
                this.drawCell(x, y, isVisible, isStart, isExit);
            }
        }
        
        // Draw the player
        this.drawPlayer(playerPosition.x, playerPosition.y);
    }

    // Add a simple fade-in animation for newly revealed cells
    animateRevealCell(x, y, isStart = false, isExit = false) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        
        // Pixel-style animation for revealing cells
        const revealFrames = 5;
        let frame = 0;
        
        const animate = () => {
            if (frame >= revealFrames) return;
            
            // Draw pixelated reveal effect
            this.ctx.fillStyle = isExit ? COLORS.EXIT : 
                                isStart ? COLORS.START : 
                                COLORS.FLOOR;
            
            const pixelSize = Math.ceil(this.cellSize / revealFrames);
            const pixelsPerFrame = Math.ceil(this.cellSize / pixelSize / revealFrames);
            
            for (let i = 0; i < pixelsPerFrame; i++) {
                const pixelX = cellX + Math.floor(Math.random() * this.cellSize);
                const pixelY = cellY + Math.floor(Math.random() * this.cellSize);
                
                this.ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
            }
            
            frame++;
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}