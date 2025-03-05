import { MazeGenerator } from '../utils/mazeGenerator.js';
import { MazeRenderer } from './MazeRenderer.js';
import { AIPlayer } from '../utils/aiPlayer.js';
import { DIRECTION, DIRECTION_DELTA, CELL, SETTINGS } from '../constants.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.mazeSize = 15; // Default maze size
        this.mazeGenerator = null;
        this.renderer = null;
        this.playerMode = 'human'; // Default player mode
        this.aiPlayer = null;
        this.aiMoveTimeout = null;
        
        this.gameState = {
            playerPosition: { x: 0, y: 0 },
            stepCount: 0,
            gameOver: false,
            started: false
        };
        
        // Input handling
        this.keyHandlers = {
            'w': () => this.movePlayer(DIRECTION.NORTH),
            'a': () => this.movePlayer(DIRECTION.WEST),
            's': () => this.movePlayer(DIRECTION.SOUTH),
            'd': () => this.movePlayer(DIRECTION.EAST),
            'arrowup': () => this.movePlayer(DIRECTION.NORTH),
            'arrowleft': () => this.movePlayer(DIRECTION.WEST),
            'arrowdown': () => this.movePlayer(DIRECTION.SOUTH),
            'arrowright': () => this.movePlayer(DIRECTION.EAST)
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Keyboard input for player movement
        document.addEventListener('keydown', (event) => {
            if (this.gameState.gameOver || !this.gameState.started || this.playerMode !== 'human') {
                return;
            }
            
            const key = event.key.toLowerCase();
            
            if (this.keyHandlers[key]) {
                event.preventDefault();
                this.keyHandlers[key]();
            }
        });
    }

    initialize(size = 15, playerMode = 'human') {
        // Clear any existing AI move timeout
        if (this.aiMoveTimeout) {
            clearTimeout(this.aiMoveTimeout);
            this.aiMoveTimeout = null;
        }
        
        // Update settings
        this.mazeSize = size;
        this.playerMode = playerMode;
        
        // Reset game state
        this.gameState = {
            playerPosition: { x: 0, y: 0 },
            stepCount: 0,
            gameOver: false,
            started: true
        };
        
        // Generate new maze
        this.mazeGenerator = new MazeGenerator(this.mazeSize, this.mazeSize);
        const { grid, start, exit } = this.mazeGenerator.generate();
        
        // Set player's starting position
        this.gameState.playerPosition = { ...start };
        
        // Create renderer
        this.renderer = new MazeRenderer(this.canvas, this.mazeGenerator);
        
        // Initialize AI player if in AI mode
        if (this.playerMode !== 'human') {
            this.aiPlayer = new AIPlayer(this.playerMode);
            this.aiPlayer.setGameState(this.gameState, this.mazeGenerator);
            this.scheduleAIMove();
        } else {
            this.aiPlayer = null;
        }
        
        // Update step counter display
        this.updateStepCounter();
        
        // Render the initial state
        this.renderer.render(this.gameState.playerPosition);
    }

    movePlayer(direction) {
        if (this.gameState.gameOver) return false;
        
        const { dx, dy } = DIRECTION_DELTA[direction];
        const newX = this.gameState.playerPosition.x + dx;
        const newY = this.gameState.playerPosition.y + dy;
        
        // Check if the move is valid (no wall in that direction)
        let canMove = false;
        
        switch (direction) {
            case DIRECTION.NORTH:
                canMove = !this.mazeGenerator.hasWall(this.gameState.playerPosition.x, this.gameState.playerPosition.y, CELL.N);
                break;
            case DIRECTION.EAST:
                canMove = !this.mazeGenerator.hasWall(this.gameState.playerPosition.x, this.gameState.playerPosition.y, CELL.E);
                break;
            case DIRECTION.SOUTH:
                canMove = !this.mazeGenerator.hasWall(this.gameState.playerPosition.x, this.gameState.playerPosition.y, CELL.S);
                break;
            case DIRECTION.WEST:
                canMove = !this.mazeGenerator.hasWall(this.gameState.playerPosition.x, this.gameState.playerPosition.y, CELL.W);
                break;
        }
        
        if (canMove) {
            // Update player position
            this.gameState.playerPosition = { x: newX, y: newY };
            this.gameState.stepCount++;
            
            // Update step counter display
            this.updateStepCounter();
            
            // Check if player has reached the exit or the exit area
            if (
                // Check if at exact exit position
                (newX === this.mazeGenerator.exit.x && newY === this.mazeGenerator.exit.y) ||
                // Check if at one square outside the maze exit
                (Math.abs(newX - this.mazeGenerator.exit.x) <= 1 && Math.abs(newY - this.mazeGenerator.exit.y) <= 1)
            ) {
                this.gameWon();
            }
            
            // Render the updated state
            this.renderer.render(this.gameState.playerPosition);
            
            return true;
        }
        
        return false;
    }

    updateStepCounter() {
        const stepCounter = document.getElementById('step-counter');
        if (stepCounter) {
            stepCounter.textContent = this.gameState.stepCount;
        }
    }

    gameWon() {
        this.gameState.gameOver = true;
        
        // Clear any AI move timeout
        if (this.aiMoveTimeout) {
            clearTimeout(this.aiMoveTimeout);
            this.aiMoveTimeout = null;
        }
        
        // Show win message
        setTimeout(() => {
            alert(`Congratulations! You solved the maze in ${this.gameState.stepCount} steps.`);
        }, 100);
    }

    async scheduleAIMove() {
        if (!this.aiPlayer || this.gameState.gameOver) return;
        
        this.aiMoveTimeout = setTimeout(async () => {
            const direction = await this.aiPlayer.getNextMove(this.mazeGenerator);
            
            if (direction) {
                this.movePlayer(direction);
                
                // Schedule next move if game isn't over
                if (!this.gameState.gameOver) {
                    this.scheduleAIMove();
                }
            }
        }, SETTINGS.AI_MOVE_DELAY);
    }

    // Method to toggle between human and AI player modes
    setPlayerMode(mode) {
        if (this.playerMode === mode) return;
        
        // Clear any existing AI move timeout
        if (this.aiMoveTimeout) {
            clearTimeout(this.aiMoveTimeout);
            this.aiMoveTimeout = null;
        }
        
        this.playerMode = mode;
        
        if (mode !== 'human') {
            // Initialize AI player
            this.aiPlayer = new AIPlayer(mode);
            this.aiPlayer.setGameState(this.gameState, this.mazeGenerator);
            this.scheduleAIMove();
        } else {
            this.aiPlayer = null;
        }
    }

    // Method to resize the maze
    resize(newSize) {
        this.initialize(newSize, this.playerMode);
    }
}