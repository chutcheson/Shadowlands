# Shadowlands Maze Game

A maze exploration game with limited visibility and LLM player modes.

## Game Concept

In Shadowlands, the player navigates through a maze but only sees their immediate surroundings—just the current cell and adjacent accessible cells. This creates a sense of exploration and suspense.

## Features

- **Hunt-and-Kill Maze Generation:** Dynamically generates solvable mazes with varied paths
- **Limited Visibility:** Only the player's current position and adjacent cells are visible
- **AI Player Modes:** Watch GPT-4o or GPT-4o-mini solve the maze autonomously
- **Pixel Art Aesthetic:** Simple, clean visual style with pixel art elements
- **Adjustable Maze Size:** Choose between small, medium, large, and huge mazes

## How to Play

1. Use WASD or arrow keys to move the player through the maze
2. Find the golden exit cell to win
3. Try to solve the maze in as few steps as possible

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a file named `openai_api_key.txt` in the root directory and add your OpenAI API key
4. Start the development server:
   ```
   npm start
   ```
5. Open your browser and navigate to `http://localhost:1234`

## Technologies

- HTML5 Canvas for rendering
- JavaScript ES6+ for game logic
- OpenAI API for LLM player modes
- Parcel for bundling

## Settings

Access the settings menu to:
- Change maze size
- Switch between human player and LLM player modes (GPT-4o or GPT-4o-mini)
- Start a new game

## Notes

- The OpenAI API key is loaded from a local file for demonstration purposes. In a production environment, you would use server-side authentication.
- The game uses the `dangerouslyAllowBrowser: true` option for the OpenAI client, which is not recommended for production. In a real application, you would proxy API requests through a server.

## License

MIT