/**
 * Maze Generator using Hunt-and-Kill algorithm
 * 
 * The Hunt-and-Kill algorithm works as follows:
 * 1. Start at a random cell
 * 2. Perform a random walk, carving passages, until no unvisited neighbors exist
 * 3. Enter "hunt" mode, scanning the grid for an unvisited cell adjacent to a visited cell
 * 4. If found, carve a passage between the two and restart random walk from the new cell
 * 5. Repeat until all cells have been visited
 */

// Directions for movement
const DIRECTIONS = [
    { dx: 0, dy: -1 }, // North
    { dx: 1, dy: 0 },  // East
    { dx: 0, dy: 1 },  // South
    { dx: -1, dy: 0 }  // West
];

// Cell states 
const CELL = {
    // Walls in binary: North, East, South, West
    // 1 represents a wall, 0 represents an open passage
    N: 0b1000, // 8
    E: 0b0100, // 4
    S: 0b0010, // 2
    W: 0b0001, // 1
    ALL_WALLS: 0b1111, // 15 (all walls intact)
    VISITED: 0b10000,  // 16 (flag to mark visited cells)
    VISIBLE: 0b100000  // 32 (flag to mark currently visible cells)
};

export class MazeGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.start = { x: 0, y: 0 };
        this.exit = { x: 0, y: 0 };
        this.initializeGrid();
    }

    initializeGrid() {
        // Create a grid with all walls intact
        this.grid = Array(this.height).fill().map(() => 
            Array(this.width).fill(CELL.ALL_WALLS)
        );
    }

    // Fisher-Yates shuffle for random direction selection
    shuffleDirections() {
        const directions = [...DIRECTIONS];
        for (let i = directions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [directions[i], directions[j]] = [directions[j], directions[i]];
        }
        return directions;
    }

    // Check if a cell is within the grid boundaries
    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Check if a cell has been visited
    isVisited(x, y) {
        return !!(this.grid[y][x] & CELL.VISITED);
    }

    // Mark a cell as visited
    markVisited(x, y) {
        this.grid[y][x] |= CELL.VISITED;
    }

    // Remove wall between two cells
    removeWall(x1, y1, x2, y2) {
        // Wall between horizontal neighbors
        if (y1 === y2) {
            if (x2 > x1) { // x2 is east of x1
                this.grid[y1][x1] &= ~CELL.E;
                this.grid[y2][x2] &= ~CELL.W;
            } else { // x2 is west of x1
                this.grid[y1][x1] &= ~CELL.W;
                this.grid[y2][x2] &= ~CELL.E;
            }
        } 
        // Wall between vertical neighbors
        else if (x1 === x2) {
            if (y2 > y1) { // y2 is south of y1
                this.grid[y1][x1] &= ~CELL.S;
                this.grid[y2][x2] &= ~CELL.N;
            } else { // y2 is north of y1
                this.grid[y1][x1] &= ~CELL.N;
                this.grid[y2][x2] &= ~CELL.S;
            }
        }
    }

    // Get unvisited neighbors of a cell
    getUnvisitedNeighbors(x, y) {
        const neighbors = [];
        
        for (const { dx, dy } of DIRECTIONS) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (this.isInBounds(nx, ny) && !this.isVisited(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        
        return neighbors;
    }

    // Get visited neighbors of a cell
    getVisitedNeighbors(x, y) {
        const neighbors = [];
        
        for (const { dx, dy } of DIRECTIONS) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (this.isInBounds(nx, ny) && this.isVisited(nx, ny)) {
                neighbors.push({ x: nx, y: ny });
            }
        }
        
        return neighbors;
    }

    // Hunt for an unvisited cell adjacent to a visited cell
    hunt() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.isVisited(x, y)) {
                    const visitedNeighbors = this.getVisitedNeighbors(x, y);
                    if (visitedNeighbors.length > 0) {
                        // Randomly choose one of the visited neighbors
                        const neighbor = visitedNeighbors[Math.floor(Math.random() * visitedNeighbors.length)];
                        this.removeWall(x, y, neighbor.x, neighbor.y);
                        this.markVisited(x, y);
                        return { x, y };
                    }
                }
            }
        }
        
        return null; // No unvisited cells found
    }

    // Generate the maze using Hunt-and-Kill algorithm
    generate() {
        // Start at a random cell
        let x = Math.floor(Math.random() * this.width);
        let y = Math.floor(Math.random() * this.height);
        this.start = { x, y };
        
        this.markVisited(x, y);
        
        let done = false;
        
        while (!done) {
            // Walk randomly until we can't go any further
            let walking = true;
            
            while (walking) {
                const neighbors = this.getUnvisitedNeighbors(x, y);
                
                if (neighbors.length > 0) {
                    // Choose a random unvisited neighbor
                    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                    this.removeWall(x, y, next.x, next.y);
                    this.markVisited(next.x, next.y);
                    
                    // Move to the chosen neighbor
                    x = next.x;
                    y = next.y;
                } else {
                    walking = false;
                }
            }
            
            // Hunt for a new starting point
            const newStart = this.hunt();
            
            if (newStart) {
                x = newStart.x;
                y = newStart.y;
            } else {
                // If no new starting point is found, we're done
                done = true;
            }
        }
        
        // Find the farthest point from start to place the exit
        this.findExit();
        
        return { grid: this.grid, start: this.start, exit: this.exit };
    }

    // Find the exit point (farthest from start)
    findExit() {
        // Use breadth-first search to find the cell farthest from the start
        const queue = [{ ...this.start, distance: 0 }];
        const visited = new Set();
        visited.add(`${this.start.x},${this.start.y}`);
        
        let farthest = { ...this.start, distance: 0 };
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            // If this is the farthest cell so far, update farthest
            if (current.distance > farthest.distance) {
                farthest = current;
            }
            
            // Check each direction
            for (let i = 0; i < DIRECTIONS.length; i++) {
                const { dx, dy } = DIRECTIONS[i];
                const nx = current.x + dx;
                const ny = current.y + dy;
                const key = `${nx},${ny}`;
                
                // Check if there's a path in this direction
                if (this.isInBounds(nx, ny) && !visited.has(key)) {
                    // Check if there's a wall between the cells
                    let hasWall = false;
                    
                    if (dx === 0 && dy === -1) {  // North
                        hasWall = !!(this.grid[current.y][current.x] & CELL.N);
                    } else if (dx === 1 && dy === 0) {  // East
                        hasWall = !!(this.grid[current.y][current.x] & CELL.E);
                    } else if (dx === 0 && dy === 1) {  // South
                        hasWall = !!(this.grid[current.y][current.x] & CELL.S);
                    } else if (dx === -1 && dy === 0) {  // West
                        hasWall = !!(this.grid[current.y][current.x] & CELL.W);
                    }
                    
                    if (!hasWall) {
                        visited.add(key);
                        queue.push({ 
                            x: nx, 
                            y: ny, 
                            distance: current.distance + 1 
                        });
                    }
                }
            }
        }
        
        this.exit = { x: farthest.x, y: farthest.y };
    }

    // Get the walls for a specific cell
    getWalls(x, y) {
        if (!this.isInBounds(x, y)) return CELL.ALL_WALLS;
        return this.grid[y][x] & CELL.ALL_WALLS; // Return only the wall bits
    }

    // Check if a cell has a specific wall
    hasWall(x, y, direction) {
        if (!this.isInBounds(x, y)) return true;
        return !!(this.grid[y][x] & direction);
    }

    // Mark a cell as visible
    markVisible(x, y) {
        if (this.isInBounds(x, y)) {
            this.grid[y][x] |= CELL.VISIBLE;
        }
    }

    // Check if a cell is visible
    isVisible(x, y) {
        if (!this.isInBounds(x, y)) return false;
        return !!(this.grid[y][x] & CELL.VISIBLE);
    }

    // Reset visibility of all cells
    resetVisibility() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x] &= ~CELL.VISIBLE;
            }
        }
    }

    // Update visibility around player position
    updateVisibility(playerX, playerY) {
        this.resetVisibility();
        
        // Mark player's cell as visible
        this.markVisible(playerX, playerY);
        
        // Mark adjacent cells as visible if there's no wall
        for (let i = 0; i < DIRECTIONS.length; i++) {
            const { dx, dy } = DIRECTIONS[i];
            const nx = playerX + dx;
            const ny = playerY + dy;
            
            // Check if there's a wall in this direction
            let hasWall = false;
            
            if (dx === 0 && dy === -1) {  // North
                hasWall = this.hasWall(playerX, playerY, CELL.N);
            } else if (dx === 1 && dy === 0) {  // East
                hasWall = this.hasWall(playerX, playerY, CELL.E);
            } else if (dx === 0 && dy === 1) {  // South
                hasWall = this.hasWall(playerX, playerY, CELL.S);
            } else if (dx === -1 && dy === 0) {  // West
                hasWall = this.hasWall(playerX, playerY, CELL.W);
            }
            
            if (!hasWall) {
                this.markVisible(nx, ny);
            }
        }
        
        // Always make the exit and surrounding areas visible
        this.markVisible(this.exit.x, this.exit.y);
        
        // Mark cells around exit as visible
        for (let i = 0; i < DIRECTIONS.length; i++) {
            const { dx, dy } = DIRECTIONS[i];
            this.markVisible(this.exit.x + dx, this.exit.y + dy);
        }
    }
}