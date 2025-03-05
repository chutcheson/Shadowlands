import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { CELL } from '../constants.js';

// Load API keys from files (unsafe for production, just for demo)
let openaiApiKey = null;
let anthropicApiKey = null;

async function loadOpenAIKey() {
    try {
        const response = await fetch('/openai_api_key.txt');
        openaiApiKey = await response.text();
        return openaiApiKey.trim();
    } catch (error) {
        console.error('Failed to load OpenAI API key:', error);
        return null;
    }
}

async function loadAnthropicKey() {
    try {
        const response = await fetch('/anthropic_api_key.txt');
        anthropicApiKey = await response.text();
        return anthropicApiKey.trim();
    } catch (error) {
        console.error('Failed to load Anthropic API key:', error);
        return null;
    }
}

export class AIPlayer {
    constructor(model = 'gpt-4o') {
        this.model = model;
        this.client = null;
        this.isReady = false;
        this.gameState = null;
        this.mazeInfo = null;
        this.history = [];
    }

    async initialize() {
        // Determine which API client to initialize based on the model
        if (this.model.startsWith('gpt')) {
            // Initialize OpenAI client
            if (!openaiApiKey) {
                openaiApiKey = await loadOpenAIKey();
            }
            
            if (!openaiApiKey) {
                console.error('No OpenAI API key available');
                return false;
            }

            try {
                this.client = new OpenAI({
                    apiKey: openaiApiKey,
                    dangerouslyAllowBrowser: true // Only for demo purposes
                });
                this.isReady = true;
                return true;
            } catch (error) {
                console.error('Failed to initialize OpenAI client:', error);
                return false;
            }
        } else if (this.model.startsWith('claude')) {
            // Initialize Anthropic client
            if (!anthropicApiKey) {
                anthropicApiKey = await loadAnthropicKey();
                console.log("Loaded Anthropic API key (first few chars):", 
                    anthropicApiKey ? anthropicApiKey.substring(0, 8) + "..." : "null");
            }
            
            if (!anthropicApiKey) {
                console.error('No Anthropic API key available');
                return false;
            }

            try {
                console.log("Creating Anthropic client with key (first few chars):", 
                    anthropicApiKey.substring(0, 8) + "...");
                
                this.client = new Anthropic({
                    apiKey: anthropicApiKey,
                });
                
                console.log("Anthropic client created successfully:", !!this.client);
                this.isReady = true;
                return true;
            } catch (error) {
                console.error('Failed to initialize Anthropic client:', error);
                return false;
            }
        } else {
            console.error('Unknown model type:', this.model);
            return false;
        }
    }

    setGameState(gameState, mazeGenerator) {
        this.gameState = gameState;
        this.mazeInfo = {
            width: mazeGenerator.width,
            height: mazeGenerator.height,
            startPosition: mazeGenerator.start,
            exitPosition: mazeGenerator.exit,
            playerPosition: { ...gameState.playerPosition }
        };
        
        // Reset history with initial state
        this.history = [{
            position: { ...gameState.playerPosition },
            visibleCells: this.getVisibleCellsDescription(mazeGenerator)
        }];
    }

    getVisibleCellsDescription(mazeGenerator) {
        const visibleCells = [];
        const { x: playerX, y: playerY } = this.gameState.playerPosition;
        
        // Current cell
        visibleCells.push({
            position: { x: playerX, y: playerY },
            walls: {
                north: mazeGenerator.hasWall(playerX, playerY, CELL.N),
                east: mazeGenerator.hasWall(playerX, playerY, CELL.E),
                south: mazeGenerator.hasWall(playerX, playerY, CELL.S),
                west: mazeGenerator.hasWall(playerX, playerY, CELL.W)
            },
            isStart: playerX === mazeGenerator.start.x && playerY === mazeGenerator.start.y,
            isExit: playerX === mazeGenerator.exit.x && playerY === mazeGenerator.exit.y
        });
        
        // Adjacent cells if visible
        const directions = [
            { name: 'north', dx: 0, dy: -1, wall: CELL.N },
            { name: 'east', dx: 1, dy: 0, wall: CELL.E },
            { name: 'south', dx: 0, dy: 1, wall: CELL.S },
            { name: 'west', dx: -1, dy: 0, wall: CELL.W }
        ];
        
        for (const dir of directions) {
            const nx = playerX + dir.dx;
            const ny = playerY + dir.dy;
            
            // Check if cell is visible (no wall between player and this cell)
            if (!mazeGenerator.hasWall(playerX, playerY, dir.wall) && mazeGenerator.isInBounds(nx, ny)) {
                visibleCells.push({
                    position: { x: nx, y: ny },
                    walls: {
                        north: mazeGenerator.hasWall(nx, ny, CELL.N),
                        east: mazeGenerator.hasWall(nx, ny, CELL.E),
                        south: mazeGenerator.hasWall(nx, ny, CELL.S),
                        west: mazeGenerator.hasWall(nx, ny, CELL.W)
                    },
                    isStart: nx === mazeGenerator.start.x && ny === mazeGenerator.start.y,
                    isExit: nx === mazeGenerator.exit.x && ny === mazeGenerator.exit.y
                });
            }
        }
        
        return visibleCells;
    }

    async getNextMove(mazeGenerator) {
        if (!this.isReady || !this.client) {
            if (!await this.initialize()) {
                return null;
            }
        }

        // Update history with current state
        const currentState = {
            position: { ...this.gameState.playerPosition },
            visibleCells: this.getVisibleCellsDescription(mazeGenerator)
        };
        
        // Only add to history if position changed from last entry
        const lastEntry = this.history[this.history.length - 1];
        if (lastEntry.position.x !== currentState.position.x || 
            lastEntry.position.y !== currentState.position.y) {
            this.history.push(currentState);
        }
        
        // Use different API methods based on the selected model
        if (this.model.startsWith('gpt')) {
            return this.getOpenAINextMove(mazeGenerator, currentState);
        } else if (this.model.startsWith('claude')) {
            return this.getAnthropicNextMove(mazeGenerator, currentState);
        } else {
            console.error('Unknown model for getNextMove:', this.model);
            return null;
        }
    }
    
    async getOpenAINextMove(mazeGenerator, currentState) {
        // Prepare the system message for OpenAI models
        const systemMessage = {
            role: 'system',
            content: `You are an AI solving a maze. Your goal is to find the exit (marked as isExit: true) from the current position.
            
You can only see your current cell and adjacent cells that are not blocked by walls. 
You must make decisions based on what you can currently see and your complete memory of where you've been.

The maze is a grid where each cell can have walls on any of its four sides: north, east, south, and west.
You can only move in directions where there is no wall.

NAVIGATION STRATEGY:
1. If you can see the exit, move toward it directly.
2. Maintain a mental map of the maze from the cells you've visited.
3. Avoid revisiting the same cells when possible.
4. Use wall-following or other maze-solving algorithms when appropriate.
5. If you find yourself in a loop, try a different direction.

For each move, you MUST return only one of: "north", "east", "south", or "west".

The maze is ${mazeGenerator.width}x${mazeGenerator.height} in size.
The exit is somewhere in the maze, marked as isExit: true when visible.
You have full access to your entire movement history since starting the maze.`
        };

        // Use full history for context (LLMs have large context windows)
        const historyMessages = this.history.map((entry, index) => {
            return {
                role: 'user',
                content: `Move ${index + 1}:
Current position: (${entry.position.x}, ${entry.position.y})
Visible cells: ${JSON.stringify(entry.visibleCells, null, 2)}`
            };
        });

        // Current state message
        const currentStateMessage = {
            role: 'user',
            content: `Current position: (${this.gameState.playerPosition.x}, ${this.gameState.playerPosition.y})
Visible cells: ${JSON.stringify(currentState.visibleCells, null, 2)}

Decide your next move. Return only: "north", "east", "south", or "west"`
        };

        try {
            // Log example of request to show what's sent to the LLM
            const exampleRequest = {
                model: this.model,
                messages: [systemMessage, ...historyMessages, currentStateMessage],
                temperature: 0.2,
                max_tokens: 50,
                top_p: 1.0,
                presence_penalty: 0.1,
                frequency_penalty: 0.5
            };
            
            // Log an example to the console for debugging
            console.log("Example LLM Request:", JSON.stringify(exampleRequest, null, 2));
            
            // Show example in the UI if possible
            const exampleEl = document.getElementById('ai-game-state');
            if (exampleEl) {
                // Display a more readable version of visible cells for the current state
                const visibleCellsDescription = currentState.visibleCells.map(cell => {
                    return `Cell at (${cell.position.x}, ${cell.position.y}):
    Walls: ${Object.entries(cell.walls).filter(([k,v]) => v).map(([k]) => k).join(', ')}
    ${cell.isStart ? '(START)' : ''}${cell.isExit ? '(EXIT)' : ''}`;
                }).join('\n');
                
                exampleEl.innerHTML = `
                <p><strong>Current position:</strong> (${this.gameState.playerPosition.x}, ${this.gameState.playerPosition.y})</p>
                <p><strong>Visible cells:</strong></p>
                <pre style="font-size: 0.8rem; background: #f6f6f6; padding: 5px; border-radius: 4px; max-height: 100px; overflow-y: auto;">${visibleCellsDescription}</pre>
                <p><strong>History:</strong> ${this.history.length} previous positions</p>
                `;
            }
            
            // Make the API call with full history and enhanced parameters
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [systemMessage, ...historyMessages, currentStateMessage],
                temperature: 0.2,
                max_tokens: 50,
                top_p: 1.0,
                presence_penalty: 0.1, // Slight penalty for repeating itself
                frequency_penalty: 0.5 // Stronger penalty to discourage visiting the same places
            });

            // Extract and process the response
            const moveResponse = response.choices[0].message.content.trim().toLowerCase();
            
            // Display the AI's response in the decision section
            const decisionEl = document.getElementById('ai-decision');
            if (decisionEl) {
                decisionEl.innerHTML = `
                <p><strong>AI response:</strong></p>
                <pre style="font-size: 0.9rem; background: #f6f6f6; padding: 5px; border-radius: 4px;">${moveResponse}</pre>
                <p><strong>Direction chosen:</strong> ${moveResponse.includes('north') ? 'north' : 
                                            moveResponse.includes('east') ? 'east' : 
                                            moveResponse.includes('south') ? 'south' : 
                                            moveResponse.includes('west') ? 'west' : 'unknown'}</p>
                `;
            }
            
            // Parse the response to get a valid direction
            if (moveResponse.includes('north')) {
                return 'north';
            } else if (moveResponse.includes('east')) {
                return 'east';
            } else if (moveResponse.includes('south')) {
                return 'south';
            } else if (moveResponse.includes('west')) {
                return 'west';
            } else {
                // If no valid direction found, extract just the first word
                const firstWord = moveResponse.split(/\s+/)[0];
                if (['north', 'east', 'south', 'west'].includes(firstWord)) {
                    return firstWord;
                }
                
                // If still can't determine, pick a random valid direction
                const validDirections = this.getValidDirections(mazeGenerator);
                return validDirections[Math.floor(Math.random() * validDirections.length)];
            }
        } catch (error) {
            console.error('Error getting next move from OpenAI:', error);
            
            // Fallback to random valid move
            const validDirections = this.getValidDirections(mazeGenerator);
            return validDirections[Math.floor(Math.random() * validDirections.length)];
        }
    }

    async getAnthropicNextMove(mazeGenerator, currentState) {
        // Create prompt for Anthropic Claude with system message and history
        let systemPrompt = `You are an AI solving a maze. Your goal is to find the exit (marked as isExit: true) from the current position.

You can only see your current cell and adjacent cells that are not blocked by walls. 
You must make decisions based on what you can currently see and your complete memory of where you've been.

The maze is a grid where each cell can have walls on any of its four sides: north, east, south, and west.
You can only move in directions where there is no wall.

NAVIGATION STRATEGY:
1. If you can see the exit, move toward it directly.
2. Maintain a mental map of the maze from the cells you've visited.
3. Avoid revisiting the same cells when possible.
4. Use wall-following or other maze-solving algorithms when appropriate.
5. If you find yourself in a loop, try a different direction.

For each move, you MUST return only one of: "north", "east", "south", or "west".

The maze is ${mazeGenerator.width}x${mazeGenerator.height} in size.
The exit is somewhere in the maze, marked as isExit: true when visible.
You have full access to your entire movement history since starting the maze.`;

        // Format history for Claude
        let historyText = this.history.map((entry, index) => {
            return `Move ${index + 1}:
Current position: (${entry.position.x}, ${entry.position.y})
Visible cells: ${JSON.stringify(entry.visibleCells, null, 2)}`;
        }).join('\n\n');

        // Current state message
        let currentPrompt = `Current position: (${this.gameState.playerPosition.x}, ${this.gameState.playerPosition.y})
Visible cells: ${JSON.stringify(currentState.visibleCells, null, 2)}

Decide your next move. Return only: "north", "east", "south", or "west"`;

        try {
            // Log example of request to show what's sent to the LLM
            const exampleRequest = {
                model: this.model,
                systemPrompt: systemPrompt,
                messages: [
                    { role: "user", content: historyText + "\n\n" + currentPrompt }
                ]
            };
            
            // Log an example to the console for debugging
            console.log("Example Claude Request:", JSON.stringify(exampleRequest, null, 2));
            
            // Show example in the UI if possible
            const exampleEl = document.getElementById('ai-game-state');
            if (exampleEl) {
                // Display a more readable version of visible cells for the current state
                const visibleCellsDescription = currentState.visibleCells.map(cell => {
                    return `Cell at (${cell.position.x}, ${cell.position.y}):
    Walls: ${Object.entries(cell.walls).filter(([k,v]) => v).map(([k]) => k).join(', ')}
    ${cell.isStart ? '(START)' : ''}${cell.isExit ? '(EXIT)' : ''}`;
                }).join('\n');
                
                exampleEl.innerHTML = `
                <p><strong>Using Claude 3.7 Sonnet</strong></p>
                <p><strong>Current position:</strong> (${this.gameState.playerPosition.x}, ${this.gameState.playerPosition.y})</p>
                <p><strong>Visible cells:</strong></p>
                <pre style="font-size: 0.8rem; background: #f6f6f6; padding: 5px; border-radius: 4px; max-height: 100px; overflow-y: auto;">${visibleCellsDescription}</pre>
                <p><strong>History:</strong> ${this.history.length} previous positions</p>
                `;
            }
            
            console.log("Making Anthropic API call with client:", this.client);
            
            // Set up specific model ID for Claude 3.7 Sonnet
            const modelToUse = "claude-3-7-sonnet-20240305";
            console.log("Using Anthropic model:", modelToUse);
            
            // Log API call attempt
            console.log("Attempting Anthropic API call with params:", {
                model: modelToUse,
                system: systemPrompt.substring(0, 50) + "...",
                messageCount: 1,
                max_tokens: 50
            });
            
            let response;
            try {
                // Make the API call to Anthropic Claude
                response = await this.client.messages.create({
                    model: modelToUse,
                    system: systemPrompt,
                    messages: [
                        { role: "user", content: historyText + "\n\n" + currentPrompt }
                    ],
                    max_tokens: 50,
                    temperature: 0.2
                });
                
                console.log("Received Anthropic response:", response);
            } catch (claudeError) {
                console.error("Detailed Anthropic API error:", claudeError);
                throw claudeError;
            }
            
            // Extract and process the response
            const moveResponse = response.content[0].text.trim().toLowerCase();
            
            // Display the AI's response in the decision section
            const decisionEl = document.getElementById('ai-decision');
            if (decisionEl) {
                decisionEl.innerHTML = `
                <p><strong>Claude response:</strong></p>
                <pre style="font-size: 0.9rem; background: #f6f6f6; padding: 5px; border-radius: 4px;">${moveResponse}</pre>
                <p><strong>Direction chosen:</strong> ${moveResponse.includes('north') ? 'north' : 
                                            moveResponse.includes('east') ? 'east' : 
                                            moveResponse.includes('south') ? 'south' : 
                                            moveResponse.includes('west') ? 'west' : 'unknown'}</p>
                `;
            }
            
            // Parse the response to get a valid direction
            if (moveResponse.includes('north')) {
                return 'north';
            } else if (moveResponse.includes('east')) {
                return 'east';
            } else if (moveResponse.includes('south')) {
                return 'south';
            } else if (moveResponse.includes('west')) {
                return 'west';
            } else {
                // If no valid direction found, extract just the first word
                const firstWord = moveResponse.split(/\s+/)[0];
                if (['north', 'east', 'south', 'west'].includes(firstWord)) {
                    return firstWord;
                }
                
                // If still can't determine, pick a random valid direction
                const validDirections = this.getValidDirections(mazeGenerator);
                return validDirections[Math.floor(Math.random() * validDirections.length)];
            }
        } catch (error) {
            console.error('Error getting next move from Anthropic:', error);
            
            // Fallback to random valid move
            const validDirections = this.getValidDirections(mazeGenerator);
            return validDirections[Math.floor(Math.random() * validDirections.length)];
        }
    }
    
    getValidDirections(mazeGenerator) {
        const { x, y } = this.gameState.playerPosition;
        const validDirections = [];
        
        if (!mazeGenerator.hasWall(x, y, CELL.N)) validDirections.push('north');
        if (!mazeGenerator.hasWall(x, y, CELL.E)) validDirections.push('east');
        if (!mazeGenerator.hasWall(x, y, CELL.S)) validDirections.push('south');
        if (!mazeGenerator.hasWall(x, y, CELL.W)) validDirections.push('west');
        
        return validDirections;
    }
}