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
        
        // Draw cell background
        if (isVisible) {
            if (isExit) {
                this.ctx.fillStyle = COLORS.EXIT;
            } else if (isStart) {
                this.ctx.fillStyle = COLORS.START;
            } else {
                this.ctx.fillStyle = COLORS.FLOOR;
            }
        } else {
            this.ctx.fillStyle = COLORS.FOG;
        }
        
        this.ctx.fillRect(
            cellX + this.wallThickness / 2, 
            cellY + this.wallThickness / 2, 
            this.cellSize - this.wallThickness, 
            this.cellSize - this.wallThickness
        );
        
        // Only draw walls if cell is visible
        if (isVisible) {
            this.ctx.fillStyle = COLORS.WALL;
            
            // Draw walls based on cell's wall configuration
            const walls = this.mazeGenerator.getWalls(x, y);
            
            // North wall
            if (walls & CELL.N) {
                this.ctx.fillRect(
                    cellX, 
                    cellY, 
                    this.cellSize, 
                    this.wallThickness
                );
            }
            
            // East wall
            if (walls & CELL.E) {
                this.ctx.fillRect(
                    cellX + this.cellSize - this.wallThickness, 
                    cellY, 
                    this.wallThickness, 
                    this.cellSize
                );
            }
            
            // South wall
            if (walls & CELL.S) {
                this.ctx.fillRect(
                    cellX, 
                    cellY + this.cellSize - this.wallThickness, 
                    this.cellSize, 
                    this.wallThickness
                );
            }
            
            // West wall
            if (walls & CELL.W) {
                this.ctx.fillRect(
                    cellX, 
                    cellY, 
                    this.wallThickness, 
                    this.cellSize
                );
            }
        }
    }

    drawPlayer(x, y) {
        const centerX = (x + 0.5) * this.cellSize;
        const centerY = (y + 0.5) * this.cellSize;
        
        // Draw player
        this.ctx.fillStyle = COLORS.PLAYER;
        this.ctx.beginPath();
        this.ctx.arc(
            centerX, 
            centerY, 
            this.playerSize / 2, 
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
            
            const pixelSize = Math.ceil((this.cellSize - this.wallThickness) / revealFrames);
            const pixelsPerFrame = Math.ceil((this.cellSize - this.wallThickness) / pixelSize / revealFrames);
            
            for (let i = 0; i < pixelsPerFrame; i++) {
                const pixelX = cellX + this.wallThickness / 2 + 
                    Math.floor(Math.random() * (this.cellSize - this.wallThickness));
                const pixelY = cellY + this.wallThickness / 2 + 
                    Math.floor(Math.random() * (this.cellSize - this.wallThickness));
                
                this.ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
            }
            
            frame++;
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}