import { CELL, COLORS, SETTINGS } from '../constants.js';

export class MazeRenderer {
    constructor(canvas, mazeGenerator) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.mazeGenerator = mazeGenerator;
        
        // Calculate appropriate cell size based on maze dimensions
        this.calculateCellSize();
        
        this.wallThickness = SETTINGS.WALL_THICKNESS;
        
        // Scale player size proportionally to cell size
        this.playerSize = Math.floor(this.cellSize * SETTINGS.PLAYER_SIZE_RATIO);
        
        this.resizeCanvas();
    }
    
    calculateCellSize() {
        // Calculate cell size based on maze dimensions to keep it within reasonable bounds
        const maxWidth = SETTINGS.MAX_MAZE_WIDTH;
        const baseCellSize = SETTINGS.BASE_CELL_SIZE;
        
        // Calculate what the maze width would be with the base cell size
        const potentialWidth = this.mazeGenerator.width * baseCellSize;
        
        if (potentialWidth > maxWidth) {
            // Scale down the cell size to fit within max width
            this.cellSize = Math.floor(maxWidth / this.mazeGenerator.width);
        } else {
            this.cellSize = baseCellSize;
        }
    }

    resizeCanvas() {
        // Set canvas dimensions based on maze size
        const width = this.mazeGenerator.width * this.cellSize;
        const height = this.mazeGenerator.height * this.cellSize;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Set pixel art rendering mode
        this.ctx.imageSmoothingEnabled = false;
        
        // Update container size if needed
        const container = this.canvas.parentElement;
        if (container) {
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;
        }
    }

    clearCanvas() {
        this.ctx.fillStyle = COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCell(x, y, isVisible = true, isStart = false, isExit = false) {
        const cellX = x * this.cellSize;
        const cellY = y * this.cellSize;
        const padding = 1; // Tiny padding for a subtle grid effect
        
        // Draw cell background with minimalist vector aesthetic
        if (isVisible) {
            // Fill background
            this.ctx.fillStyle = COLORS.FLOOR;
            this.ctx.fillRect(
                cellX + padding, 
                cellY + padding, 
                this.cellSize - padding * 2, 
                this.cellSize - padding * 2
            );
            
            // Add special styling for exit and start cells
            if (isExit) {
                // Draw exit cell with a glowing effect
                const gradient = this.ctx.createRadialGradient(
                    cellX + this.cellSize / 2,
                    cellY + this.cellSize / 2,
                    this.cellSize * 0.2,
                    cellX + this.cellSize / 2,
                    cellY + this.cellSize / 2,
                    this.cellSize * 0.8
                );
                
                gradient.addColorStop(0, COLORS.EXIT);
                gradient.addColorStop(1, this.adjustAlpha(COLORS.EXIT, 0.5));
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    cellX + padding, 
                    cellY + padding, 
                    this.cellSize - padding * 2, 
                    this.cellSize - padding * 2
                );
            } else if (isStart) {
                // Draw start cell with subtle indicator
                this.ctx.fillStyle = COLORS.START;
                this.ctx.fillRect(
                    cellX + padding, 
                    cellY + padding, 
                    this.cellSize - padding * 2, 
                    this.cellSize - padding * 2
                );
            }
            
            // Instead of drawing walls, we'll just add a subtle grid line for a cleaner look
            this.ctx.strokeStyle = 'rgba(230, 230, 230, 0.6)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(
                cellX,
                cellY,
                this.cellSize,
                this.cellSize
            );
        } else {
            // Draw fog for non-visible cells
            this.ctx.fillStyle = COLORS.FOG;
            this.ctx.fillRect(
                cellX, 
                cellY, 
                this.cellSize, 
                this.cellSize
            );
        }
    }
    
    // Helper to adjust color opacity
    adjustAlpha(hexColor, alpha) {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        
        // Draw player as a simple dot for minimalist aesthetic
        const playerSize = this.playerSize * 0.6; // Making it slightly smaller for minimalist look
        
        // Main black circle
        this.ctx.fillStyle = COLORS.PLAYER;
        this.ctx.beginPath();
        this.ctx.arc(
            centerX, 
            centerY, 
            playerSize / 2, 
            0, 
            Math.PI * 2
        );
        this.ctx.fill();
        
        // Add subtle shadow for depth
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(
            centerX + 1, 
            centerY + 1, 
            playerSize / 2, 
            playerSize / 4, 
            0, 
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