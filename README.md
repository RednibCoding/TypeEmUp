# TYPEEMUP - Space Typing Shooter

A fast-paced space shooter game where you destroy enemies by typing their words correctly. Test your typing speed and accuracy while battling through increasingly challenging waves of enemies.

![](/screenshot.png)

[**> Try it out <**](https://rednibcoding.github.io/TypeEmUp/)

[**> Video on Youtube <**](https://www.youtube.com/watch?v=s0DlEDYixeE)

## How to Play

### Starting the Game
1. Open `index.html` in a modern web browser
2. Press **SPACE** to start
3. Type the words displayed on enemies to destroy them
4. Survive through rounds and defeat boss enemies every 5 rounds

### Controls
- **Keyboard**: Type enemy words to target and destroy them
- **SPACE**: Start game / Continue to next round / Restart after game over
- **Audio Toggle Button**: Cycle through audio modes (All / SFX Only / Off)

### Game Mechanics

**Enemies**
- Regular enemies spawn from the top of the screen
- Each enemy displays a word that must be typed to destroy it
- Type the first letter to lock onto an enemy
- Complete the word to shoot and destroy the enemy
- Enemies that reach the bottom damage your hull

**Boss Fights**
- Every 5th round features a boss enemy
- Bosses have multiple health points
- Each time you hit a boss, it gets a new word to type
- Bosses are larger, slower, and worth more points

**Lock-On System**
- Targeting brackets appear when you lock onto an enemy
- Brackets travel from your ship to the enemy
- They tighten as you type more of the word
- Brackets spread and fade when the enemy is destroyed

**Difficulty Progression**
- Enemy count increases by 1 every 5 rounds (max 12 enemies)
- Enemy speed increases gradually up to round 21
- Word difficulty increases with each round
- Spawn rate increases with round number

## Scoring System

**Base Points**
- Points awarded based on word length: 10 points per character
- Boss enemies award double points

**Time Multiplier**
- Complete rounds quickly for bonus points
- Under 15 seconds: 3x multiplier
- Under 30 seconds: 2x multiplier
- Under 45 seconds: 1.5x multiplier
- Under 60 seconds: 1.25x multiplier

**Accuracy Multiplier**
- High accuracy increases your score
- 95%+ accuracy: 1.0x (no penalty)
- 90-94% accuracy: 0.9x
- 80-89% accuracy: 0.75x
- 70-79% accuracy: 0.5x
- Below 70% accuracy: 0.25x

## Stats Tracked

- **WPM** (Words Per Minute): Typing speed calculated in real-time
- **Accuracy**: Percentage of correct keystrokes
- **Hull Integrity**: Your ship's health (starts at 100%)
- **Score**: Total points accumulated
- **Round**: Current round number

## Visual Effects

- Dynamic star field with acceleration/deceleration
- Particle explosions when enemies are destroyed
- Screen shake and flash effects
- Animated lock-on targeting system
- Rotating targeting brackets
- Pulsing visual feedback for bonuses and penalties

## Audio

The game features three audio modes:

1. **All Audio**: Background music and sound effects
2. **SFX Only**: Sound effects without music
3. **Off**: No audio

Sound effects include:
- Lock-on click when targeting enemies
- Shooting sounds when firing
- Explosion sounds on impact

## Technical Details

**Built With**
- Vanilla JavaScript (ES6 modules)
- HTML5 Canvas for rendering
- Web Audio API for sound effects
- CSS animations for UI effects

**Browser Compatibility**
- Requires a modern browser with ES6 module support
- Best experienced in Chrome, Firefox, or Edge

## File Structure

```
typeemup/
├── index.html          # Main HTML file
├── styles.css          # Game styling and animations
├── main.js            # Entry point and input handling
├── game.js            # Core game logic and rendering
├── player.js          # Player ship class
├── enemy.js           # Enemy class and word banks
├── audio.js           # Audio management
└── public/
    ├── music.mp3      # Background music
    ├── explosion.wav  # Explosion sound effect
    ├── click.wav      # UI click sound
    └── shoot.mp3      # Shooting sound effect
```

## Tips for High Scores

1. **Type accurately** - Accuracy penalties severely impact your score
2. **Complete rounds quickly** - Time bonuses can triple your points
3. **Lock onto enemies early** - Start typing as soon as they appear
4. **Prioritize threats** - Focus on enemies closest to the bottom
5. **Learn word patterns** - Common words appear frequently
6. **Stay calm during boss fights** - Bosses give you multiple chances

## Word Difficulty Levels

- **Easy (Rounds 1-3)**: Short, common words (3-6 letters)
- **Medium (Rounds 4-7)**: Moderate words (5-8 letters)
- **Hard (Rounds 8-12)**: Challenging words (6-10 letters)
- **Very Hard (Round 13+)**: Complex words (7-12 letters)

Boss words are always longer and more challenging than regular enemies.


---

Good luck, pilot! May your typing be swift and your accuracy impeccable!
