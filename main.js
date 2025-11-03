import { Game } from './game.js';
import { AudioManager } from './audio.js';

// Initialize game when DOM is loaded
let game = null;
let audioManager = null;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const wordInput = document.getElementById('wordInput');
    const audioToggle = document.getElementById('audioToggle');
    const audioIcon = document.getElementById('audioIcon');
    
    // Create audio manager
    audioManager = new AudioManager();
    
    // Set initial audio icon state
    updateAudioIcon();
    
    // Create and start game
    game = new Game(canvas, audioManager);
    game.start();
    
    // Focus input
    wordInput.focus();
    
    // Track previous input value for accuracy
    let previousInput = '';
    
    // Handle typing
    wordInput.addEventListener('input', (e) => {
        const inputValue = e.target.value.toLowerCase();
        
        // If input is empty, clear active enemy
        if (inputValue.length === 0) {
            if (game.activeEnemy) {
                game.removeLockOnIndicator(game.activeEnemy);
                game.activeEnemy.active = false;
                game.activeEnemy.typedChars = 0;
                game.activeEnemy = null;
            }
            previousInput = '';
            return;
        }
        
        // Only track typing if input length increased (not backspace)
        const isTyping = inputValue.length > previousInput.length;
        
        // Play click sound for typing
        if (isTyping) {
            audioManager.playClick();
        }
        
        // Check if we have an active enemy and input still matches
        if (game.activeEnemy) {
            const word = game.activeEnemy.word.toLowerCase();
            
            // Check if input matches the start of the word
            if (word.startsWith(inputValue)) {
                game.activeEnemy.typedChars = inputValue.length;
                
                // Track typing accuracy only when adding characters
                if (isTyping) {
                    game.trackTyping(1, true);
                }
                
                // Check if word is complete
                if (inputValue === word) {
                    game.shootEnemy(game.activeEnemy);
                    e.target.value = '';
                    previousInput = '';
                    return;
                }
            } else {
                // Input doesn't match current enemy - check if another enemy matches
                let foundNewEnemy = false;
                for (let enemy of game.enemies) {
                    if (enemy !== game.activeEnemy && enemy.word.toLowerCase().startsWith(inputValue)) {
                        // Remove lock-on indicator from old enemy
                        game.removeLockOnIndicator(game.activeEnemy);
                        
                        // Switch to the new matching enemy
                        game.activeEnemy.active = false;
                        game.activeEnemy.typedChars = 0;
                        
                        enemy.active = true;
                        enemy.typedChars = inputValue.length;
                        game.activeEnemy = enemy;
                        
                        // Create lock-on indicator for new target
                        game.createLockOnIndicator(enemy);
                        
                        // Track as correct since we found a match
                        if (isTyping) {
                            game.trackTyping(1, true);
                        }
                        
                        foundNewEnemy = true;
                        
                        // Check if word is complete
                        if (inputValue === enemy.word.toLowerCase()) {
                            game.shootEnemy(enemy);
                            e.target.value = '';
                            previousInput = '';
                            return;
                        }
                        break;
                    }
                }
                
                // No matching enemy found - this is an error
                if (!foundNewEnemy) {
                    if (isTyping) {
                        game.trackTyping(1, false);
                    }
                    game.removeLockOnIndicator(game.activeEnemy);
                    game.activeEnemy.active = false;
                    game.activeEnemy.typedChars = 0;
                    game.activeEnemy = null;
                    e.target.value = '';
                    previousInput = '';
                    return;
                }
            }
        } else {
            // No active enemy - find one that matches input
            let found = false;
            for (let enemy of game.enemies) {
                if (enemy.word.toLowerCase().startsWith(inputValue)) {
                    enemy.active = true;
                    enemy.typedChars = inputValue.length;
                    game.activeEnemy = enemy;
                    
                    // Create lock-on indicator for new target
                    game.createLockOnIndicator(enemy);
                    
                    // Track typing accuracy only when adding characters
                    if (isTyping) {
                        game.trackTyping(1, true);
                    }
                    found = true;
                    
                    // Check if word is complete
                    if (inputValue === enemy.word.toLowerCase()) {
                        game.shootEnemy(enemy);
                        e.target.value = '';
                        previousInput = '';
                        return;
                    }
                    break;
                }
            }
            
            // If no match found, clear input
            if (!found) {
                if (isTyping) {
                    game.trackTyping(1, false);
                }
                e.target.value = '';
                previousInput = '';
                return;
            }
        }
        
        previousInput = inputValue;
    });
    
    // Keep input focused
    wordInput.addEventListener('blur', () => {
        setTimeout(() => wordInput.focus(), 0);
    });
    
    // Handle space bar for round transitions
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if (game.gameState === 'start') {
                e.preventDefault();
                game.startGame();
                wordInput.focus();
            } else if (game.gameState === 'roundComplete') {
                e.preventDefault();
                game.nextRound();
                wordInput.focus();
            } else if (game.gameState === 'gameOver') {
                e.preventDefault();
                game.restart();
                wordInput.focus();
            }
        }
    });
    
    // Prevent space from scrolling
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault();
        }
    });
    
    // Audio toggle button
    audioToggle.addEventListener('click', () => {
        audioManager.toggle();
        updateAudioIcon();
    });
    
    function updateAudioIcon() {
        const state = audioManager.getState();
        
        if (state === 'all') {
            audioToggle.classList.remove('muted');
            audioIcon.textContent = '🔊'; // All audio on
            audioToggle.title = 'Audio: All';
        } else if (state === 'sfx') {
            audioToggle.classList.remove('muted');
            audioIcon.textContent = 'SFX'; // Sound effects only
            audioToggle.title = 'Audio: SFX Only';
        } else {
            audioToggle.classList.add('muted');
            audioIcon.textContent = '🔇'; // All muted
            audioToggle.title = 'Audio: Off';
        }
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (game) {
        game.stop();
    }
});
