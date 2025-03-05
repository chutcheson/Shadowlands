// Cell states and wall directions
export const CELL = {
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

// Player movement directions
export const DIRECTION = {
    NORTH: 'north',
    EAST: 'east',
    SOUTH: 'south',
    WEST: 'west'
};

// Direction to delta mapping
export const DIRECTION_DELTA = {
    [DIRECTION.NORTH]: { dx: 0, dy: -1 },
    [DIRECTION.EAST]: { dx: 1, dy: 0 },
    [DIRECTION.SOUTH]: { dx: 0, dy: 1 },
    [DIRECTION.WEST]: { dx: -1, dy: 0 }
};

// Game colors
export const COLORS = {
    BACKGROUND: '#111111',
    WALL: '#ffffff',
    FLOOR: '#f5f5f5',
    PLAYER: '#000000',
    EXIT: '#ffd700',
    FOG: '#222222',
    START: '#4CAF50'
};

// Game settings
export const SETTINGS = {
    CELL_SIZE: 30,
    WALL_THICKNESS: 2,
    PLAYER_SIZE: 10,
    ANIMATION_SPEED: 200, // ms
    AI_MOVE_DELAY: 500    // ms
};