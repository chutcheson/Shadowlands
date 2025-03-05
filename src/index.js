import { Game } from './components/Game.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const canvas = document.getElementById('maze-canvas');
    const settingsButton = document.getElementById('settings-button');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsButton = document.getElementById('close-settings');
    const newGameButton = document.getElementById('new-game-button');
    const mazeSizeSelect = document.getElementById('maze-size');
    const playerModeSelect = document.getElementById('player-mode');
    
    // Initialize game
    const game = new Game(canvas);
    
    // Start a new game with default settings
    game.initialize();
    
    // Settings modal event listeners
    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });
    
    closeSettingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });
    
    // Click outside modal to close
    settingsModal.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });
    
    // New Game button
    newGameButton.addEventListener('click', () => {
        const size = parseInt(mazeSizeSelect.value);
        const playerMode = playerModeSelect.value;
        
        game.initialize(size, playerMode);
        settingsModal.style.display = 'none';
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        // If we need to adjust the canvas size based on window size
        // game.renderer.resizeCanvas();
        // game.renderer.render(game.gameState.playerPosition);
    });
    
    // Add sound effects (optional)
    const addAudioElement = () => {
        const audio = document.createElement('audio');
        audio.id = 'background-audio';
        audio.loop = true;
        audio.volume = 0.3;
        
        const source = document.createElement('source');
        source.src = 'https://assets.codepen.io/21542/howling-wind.mp3';
        source.type = 'audio/mpeg';
        
        audio.appendChild(source);
        document.body.appendChild(audio);
        
        // Add music toggle button
        const musicButton = document.createElement('div');
        musicButton.id = 'music-toggle';
        musicButton.textContent = '🔊';
        musicButton.style.position = 'absolute';
        musicButton.style.top = '10px';
        musicButton.style.right = '10px';
        musicButton.style.cursor = 'pointer';
        musicButton.style.fontSize = '24px';
        musicButton.style.zIndex = '1000';
        
        musicButton.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                musicButton.textContent = '🔊';
            } else {
                audio.pause();
                musicButton.textContent = '🔇';
            }
        });
        
        document.body.appendChild(musicButton);
        
        // Play on user interaction
        document.addEventListener('click', () => {
            if (audio.paused) {
                audio.play().catch(e => {
                    console.log("Audio playback failed:", e);
                });
            }
        }, { once: true });
    };
    
    // Uncomment to add audio
    // addAudioElement();
});