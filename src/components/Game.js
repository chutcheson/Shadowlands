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
        
        // Create renderer with auto-scaling based on maze size
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
        
        // Also update AI reasoning display to show initial state
        if (this.playerMode !== 'human' && this.aiPlayer) {
            this.updateAIReasoningDisplay();
        }
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
            
            // Check if player has reached the exact exit position (fixed the bug)
            if (newX === this.mazeGenerator.exit.x && newY === this.mazeGenerator.exit.y) {
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
        
        // Update AI reasoning display if in AI mode
        if (this.playerMode !== 'human' && this.aiPlayer) {
            this.updateAIReasoningDisplay();
        }
    }
    
    updateAIReasoningDisplay() {
        // Update the game state section
        const gameStateEl = document.getElementById('ai-game-state');
        if (gameStateEl && !this.aiPlayer) {
            // Only show this if we don't have an AI player yet
            // (The AI player class will handle showing its own representation)
            const playerPos = this.gameState.playerPosition;
            const exitPos = this.mazeGenerator.exit;
            const distance = Math.abs(playerPos.x - exitPos.x) + Math.abs(playerPos.y - exitPos.y);
            
            gameStateEl.innerHTML = `
                <p><strong>Current position:</strong> (${playerPos.x}, ${playerPos.y})</p>
                <p><strong>Exit position:</strong> (${exitPos.x}, ${exitPos.y})</p>
                <p><strong>Manhattan distance to exit:</strong> ${distance}</p>
                <p><strong>Steps taken:</strong> ${this.gameState.stepCount}</p>
            `;
        }
        
        // Simulate AI thoughts based on current position
        const thoughtsEl = document.getElementById('ai-thoughts');
        if (thoughtsEl) {
            const thoughts = this.simulateAIThoughts();
            thoughtsEl.innerHTML = thoughts;
        }
        
        // Update decision display
        const decisionEl = document.getElementById('ai-decision');
        if (decisionEl) {
            decisionEl.innerHTML = `<p>Moving ${this.lastAIMove || 'calculating...'}</p>`;
        }
    }
    
    simulateAIThoughts() {
        // A more comprehensive simulation of what an AI might think when solving the maze
        const playerPos = this.gameState.playerPosition;
        const exitPos = this.mazeGenerator.exit;
        const walls = [];
        const openDirections = [];
        
        // Check available moves
        if (this.mazeGenerator.hasWall(playerPos.x, playerPos.y, CELL.N)) {
            walls.push('north');
        } else {
            openDirections.push('north');
        }
        
        if (this.mazeGenerator.hasWall(playerPos.x, playerPos.y, CELL.E)) {
            walls.push('east');
        } else {
            openDirections.push('east');
        }
        
        if (this.mazeGenerator.hasWall(playerPos.x, playerPos.y, CELL.S)) {
            walls.push('south');
        } else {
            openDirections.push('south');
        }
        
        if (this.mazeGenerator.hasWall(playerPos.x, playerPos.y, CELL.W)) {
            walls.push('west');
        } else {
            openDirections.push('west');
        }
        
        // Generate thoughts based on current situation
        let thoughts = '';
        
        // Path topology analysis
        if (walls.length >= 3) {
            thoughts += `<p>I'm in a narrow passage with walls to the ${walls.join(', ')}.</p>`;
            thoughts += `<p>Only one way to go: ${openDirections[0]}.</p>`;
        } else if (walls.length === 2) {
            thoughts += `<p>This is a corridor with open paths to the ${openDirections.join(' and ')}.</p>`;
        } else if (walls.length <= 1) {
            thoughts += `<p>This appears to be a junction with multiple possible paths: ${openDirections.join(', ')}.</p>`;
            thoughts += `<p>I should carefully consider which direction to explore first.</p>`;
        }
        
        // Compute Manhattan distance to exit
        const manhattanDistance = Math.abs(playerPos.x - exitPos.x) + Math.abs(playerPos.y - exitPos.y);
        thoughts += `<p>I estimate I'm about ${manhattanDistance} cells away from the exit (Manhattan distance).</p>`;
        
        // Direction to exit
        const directionHints = [];
        if (playerPos.x < exitPos.x) {
            directionHints.push("east");
        } else if (playerPos.x > exitPos.x) {
            directionHints.push("west");
        }
        
        if (playerPos.y < exitPos.y) {
            directionHints.push("south");
        } else if (playerPos.y > exitPos.y) {
            directionHints.push("north");
        }
        
        if (directionHints.length > 0) {
            thoughts += `<p>Based on my mental map, the exit should be somewhere to the ${directionHints.join(' and ')}.</p>`;
        }
        
        // Add maze solving strategy thoughts based on step count
        if (this.gameState.stepCount > 20) {
            const strategyThoughts = [
                "<p>I should be using the wall-following algorithm to ensure I explore the entire maze.</p>",
                "<p>I need to maintain a comprehensive mental map of where I've been.</p>",
                "<p>I might be in a loop, should analyze my movement history.</p>",
                "<p>Perhaps I should try a different maze-solving algorithm now.</p>",
                "<p>If I keep hitting dead ends, I should systematically mark them in my mental map.</p>"
            ];
            thoughts += strategyThoughts[Math.floor(Math.random() * strategyThoughts.length)];
        } else {
            // Beginner thoughts for early in the maze
            const earlyThoughts = [
                "<p>I'll prioritize unexplored paths to avoid revisiting cells.</p>",
                "<p>I should remember junctions for backtracking if needed.</p>",
                "<p>I'll try to move generally in the direction of the exit when possible.</p>",
                "<p>I need to start building a mental map of the maze structure.</p>",
                "<p>Let me explore systematically to understand the maze layout.</p>"
            ];
            thoughts += earlyThoughts[Math.floor(Math.random() * earlyThoughts.length)];
        }
        
        return thoughts;
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
                // Store the last AI move for the reasoning display
                this.lastAIMove = direction;
                
                // Update the decision display before making the move
                const decisionEl = document.getElementById('ai-decision');
                if (decisionEl) {
                    decisionEl.innerHTML = `<p>Moving ${direction}</p>`;
                }
                
                this.movePlayer(direction);
                
                // Schedule next move if game isn't over, with a 
                // dynamically increasing delay for larger mazes to allow
                // the model more thinking time as the game progresses
                if (!this.gameState.gameOver) {
                    // Increase delay for larger mazes or as steps increase
                    const baseDelay = SETTINGS.AI_MOVE_DELAY;
                    const stepFactor = Math.min(1.5, 1 + (this.gameState.stepCount / 100)); // Gradually increase delay
                    const mazeComplexityFactor = Math.min(1.5, this.mazeSize / 10); // Larger mazes get more delay
                    
                    // Apply the delay scaling factors
                    const adjustedDelay = baseDelay * stepFactor * mazeComplexityFactor;
                    
                    setTimeout(() => {
                        this.scheduleAIMove();
                    }, adjustedDelay);
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