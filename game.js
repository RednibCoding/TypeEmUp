import { Player } from './player.js';
import { Enemy, getRandomWord, getBossWord } from './enemy.js';

export class Game {
    constructor(canvas, audioManager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioManager = audioManager;
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.player = new Player(this.canvas);
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.stars = []; // Background stars for space effect
        this.lockOnIndicators = []; // Lock-on animations
        
        // Initialize stars
        this.initStars();
        this.starSpeedMultiplier = 0; // Starts at 0, accelerates over time
        this.starAccelerating = false; // Track if stars should be accelerating or decelerating
        
        this.round = 1;
        this.score = 0;
        this.enemiesDestroyed = 0;
        this.enemiesPerRound = 5;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 140; // Frames between spawns (increased from 120)
        
        this.gameState = 'start'; // start, playing, roundComplete, gameOver
        this.activeEnemy = null; // Currently being typed
        
        // Boss mode
        this.isBossRound = false;
        this.bossEnemy = null;
        this.roundCompleting = false;
        
        // Track used words this round to prevent duplicates
        this.usedWordsThisRound = new Set();
        
        // Typing speed tracking
        this.roundStartTime = Date.now();
        this.totalCharactersTyped = 0;
        this.correctCharactersTyped = 0;
        
        // Overall game stats
        this.gameStartTime = Date.now();
        this.overallCharactersTyped = 0;
        this.overallCorrectCharactersTyped = 0;
        
        // Screen shake effect
        this.shakeAmount = 0;
        this.shakeDuration = 0;
        
        // Flash effect
        this.flashAlpha = 0;
        this.flashColor = '#ffffff';
        
        this.animationId = null;
    }

    resizeCanvas() {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;
        
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Reposition player proportionally
        if (this.player && oldWidth > 0 && oldHeight > 0) {
            const xRatio = this.canvas.width / oldWidth;
            const yRatio = this.canvas.height / oldHeight;
            
            this.player.x = this.player.x * xRatio;
            this.player.y = this.player.y * yRatio;
            
            // Ensure player stays at bottom
            this.player.y = this.canvas.height - 80;
            
            // Center player horizontally if it goes off screen
            if (this.player.x < 0 || this.player.x > this.canvas.width - this.player.width) {
                this.player.x = this.canvas.width / 2 - this.player.width / 2;
            }
        }
        
        // Reposition enemies proportionally
        if (this.enemies && oldWidth > 0 && oldHeight > 0) {
            const xRatio = this.canvas.width / oldWidth;
            const yRatio = this.canvas.height / oldHeight;
            
            this.enemies.forEach(enemy => {
                enemy.x = enemy.x * xRatio;
                enemy.y = enemy.y * yRatio;
            });
        }
        
        // Reinitialize stars on resize
        if (this.stars) {
            this.initStars();
        }
    }
    
    initStars() {
        this.stars = [];
        const starCount = 100; // Number of stars
        
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5, // Star size 0.5-2.5
                baseSpeed: Math.random() * 3 + 1, // Base speed 1-4 (will be multiplied)
                opacity: Math.random() * 0.5 + 0.3 // Opacity 0.3-0.8
            });
        }
    }

    start() {
        this.gameLoop();
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Always update stars (for deceleration effect during popups)
        this.updateStars();
        
        if (this.gameState !== 'playing') {
            return;
        }
        
        // Gradually accelerate star speed (caps at 2.5x over ~5 seconds)
        if (this.starAccelerating && this.starSpeedMultiplier < 2.5) {
            this.starSpeedMultiplier += 0.008; // Accelerates over ~300 frames (5 seconds at 60fps)
        }
        
        // Update screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration--;
            if (this.shakeDuration === 0) {
                this.shakeAmount = 0;
            }
        }
        
        // Update flash effect
        if (this.flashAlpha > 0) {
            this.flashAlpha -= 0.05;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }
        
        // Spawn enemies (skip spawning for boss rounds)
        if (!this.isBossRound) {
            this.spawnTimer++;
            if (this.enemiesSpawned < this.enemiesPerRound && this.spawnTimer >= this.spawnInterval) {
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update();
            
            // Check if enemy reached bottom
            if (enemy.hasReachedBottom(this.canvas.height)) {
                this.enemies.splice(i, 1);
                const damage = enemy.isBoss ? 20 : 10;
                const gameOver = this.player.takeDamage(damage);
                this.updateHealthDisplay();
                
                // Play explosion sound when enemy hits player
                this.audioManager.playExplosion();
                
                if (gameOver) {
                    this.endGame();
                    return;
                }
                
                // Reset active enemy if it was this one
                if (this.activeEnemy === enemy) {
                    this.activeEnemy = null;
                }
                
                // Clear boss reference
                if (enemy.isBoss) {
                    this.bossEnemy = null;
                }
            }
        }
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update target position if enemy still exists
            if (bullet.targetEnemy && this.enemies.includes(bullet.targetEnemy)) {
                bullet.targetX = bullet.targetEnemy.x + bullet.targetEnemy.width / 2;
                bullet.targetY = bullet.targetEnemy.y + bullet.targetEnemy.height / 2;
            }
            
            // Calculate direction
            const dx = bullet.targetX - bullet.x;
            const dy = bullet.targetY - bullet.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < bullet.speed) {
                // Bullet reached target - now hit the enemy
                if (bullet.targetEnemy && this.enemies.includes(bullet.targetEnemy)) {
                    const enemy = bullet.targetEnemy;
                    
                    // Create explosion at enemy position (boss or regular)
                    this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.isBoss);
                    
                    // Play explosion sound
                    this.audioManager.playExplosion();
                    
                    // Hit the enemy (handles damage for boss or destruction for regular)
                    this.hitEnemy(enemy);
                    
                    // Clear active enemy if it was this one
                    if (this.activeEnemy === enemy) {
                        this.activeEnemy = null;
                    }
                }
                
                // Remove bullet
                this.bullets.splice(i, 1);
            } else {
                // Move bullet
                bullet.x += (dx / dist) * bullet.speed;
                bullet.y += (dy / dist) * bullet.speed;
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.alpha = p.life / p.maxLife;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update lock-on indicators
        for (let i = this.lockOnIndicators.length - 1; i >= 0; i--) {
            const indicator = this.lockOnIndicators[i];
            
            if (!indicator.enemy || !this.enemies.includes(indicator.enemy)) {
                // Enemy destroyed - start fade out and spread animation
                if (!indicator.destroying) {
                    indicator.destroying = true;
                    indicator.destroyProgress = 0;
                }
                
                // Update destruction animation
                indicator.destroyProgress += 0.05;
                indicator.rotation += 0.05; // Rotate faster during destruction
                
                if (indicator.destroyProgress >= 1) {
                    // Animation complete, remove indicator
                    this.lockOnIndicators.splice(i, 1);
                }
                continue;
            }
            
            // Phase 1: Move from player to enemy (first 40% of animation)
            if (indicator.progress < 0.4) {
                indicator.progress += 0.02;
            }
            // Phase 2: Hover around enemy and tighten based on typing progress
            // (progress stays at 0.4+ and is updated based on typing completion)
            
            // Update rotation
            indicator.rotation += 0.03; // Rotate continuously
            
            // Smoothly lerp the offset based on typing progress
            if (indicator.progress >= 0.4) {
                const enemy = indicator.enemy;
                const typingProgress = enemy.typedChars / enemy.word.length;
                
                // Calculate target offset based on typing progress
                const maxOffset = 60;
                const minOffset = 15;
                const targetOffset = maxOffset - (maxOffset - minOffset) * typingProgress;
                
                // Lerp current offset toward target (smooth transition)
                indicator.currentOffset += (targetOffset - indicator.currentOffset) * 0.15;
            }
        }
        
        // Check round completion
        if (this.isBossRound) {
            // Boss round ends when boss is destroyed
            if (this.bossEnemy === null && this.enemies.length === 0 && !this.roundCompleting) {
                this.roundCompleting = true;
                // Stop star acceleration immediately (they will decelerate)
                this.starAccelerating = false;
                
                setTimeout(() => {
                    this.completeRound();
                    this.roundCompleting = false;
                }, 2000); // 2 second delay
            }
        } else {
            // Normal round ends when all enemies are spawned and destroyed
            if (this.enemiesSpawned >= this.enemiesPerRound && this.enemies.length === 0 && !this.roundCompleting) {
                this.roundCompleting = true;
                // Stop star acceleration immediately (they will decelerate)
                this.starAccelerating = false;
                
                setTimeout(() => {
                    this.completeRound();
                    this.roundCompleting = false;
                }, 2000); // 2 second delay
            }
        }
    }

    draw() {
        // Clear canvas with console background
        this.ctx.fillStyle = '#0d1117';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars before grid (background layer)
        this.drawStars();
        
        // Apply screen shake
        this.ctx.save();
        if (this.shakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeAmount;
            const shakeY = (Math.random() - 0.5) * this.shakeAmount;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Draw grid effect
        this.drawGrid();
        
        // Draw start screen
        if (this.gameState === 'start') {
            this.drawStartScreen();
            this.ctx.restore();
            return;
        }
        
        // Draw particles (batch rendering to reduce save/restore calls)
        if (this.particles.length > 0) {
            this.ctx.save();
            this.ctx.shadowBlur = 10;
            this.particles.forEach(p => {
                this.ctx.globalAlpha = p.alpha;
                this.ctx.fillStyle = p.color;
                this.ctx.shadowColor = p.color;
                this.ctx.fillRect(p.x, p.y, p.size, p.size);
            });
            this.ctx.restore();
        }
        
        // Draw bullets
        this.bullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.fillStyle = '#a8d5e2';
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'rgba(168, 213, 226, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw lock-on indicators
        this.drawLockOnIndicators();
        
        // Draw player
        this.player.draw(this.ctx);
        
        // Draw flash effect on top of everything
        if (this.flashAlpha > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.flashAlpha;
            this.ctx.fillStyle = this.flashColor;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        
        // Restore context (end screen shake)
        this.ctx.restore();
    }
    
    updateStars() {
        // Decelerate stars when not accelerating (round complete)
        if (!this.starAccelerating && this.starSpeedMultiplier > 0) {
            this.starSpeedMultiplier -= 0.021; // Faster deceleration to stop within 2 seconds
            if (this.starSpeedMultiplier < 0) {
                this.starSpeedMultiplier = 0;
            }
        }
        
        this.stars.forEach(star => {
            star.y += star.baseSpeed * this.starSpeedMultiplier;
            
            // Reset star to top when it goes off bottom
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
    }
    
    drawStars() {
        this.ctx.save();
        this.stars.forEach(star => {
            this.ctx.globalAlpha = star.opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        this.ctx.restore();
    }

    drawGrid() {
        // Skip grid for performance - or draw less frequently
        // Only draw every other frame to reduce CPU usage
        if (!this.gridFrame) this.gridFrame = 0;
        this.gridFrame++;
        if (this.gridFrame % 2 !== 0) return; // Skip every other frame
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(168, 213, 226, 0.05)';
        this.ctx.lineWidth = 1;
        
        // Draw lines every 40px (original spacing)
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawStartScreen() {
        this.ctx.save();
        
        // Title
        this.ctx.font = 'bold 48px Courier New';
        this.ctx.fillStyle = '#a8d5e2';
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = 'rgba(168, 213, 226, 0.6)';
        this.ctx.fillText('TYPEEMUP', this.canvas.width / 2, this.canvas.height / 2 - 60);
        
        // Subtitle
        this.ctx.font = 'bold 20px Courier New';
        this.ctx.fillStyle = '#7bb3d4';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('SPACE TYPING SHOOTER', this.canvas.width / 2, this.canvas.height / 2 - 10);
        
        // Pulsing start text
        const pulseAlpha = 0.5 + Math.sin(Date.now() / 300) * 0.5;
        this.ctx.globalAlpha = pulseAlpha;
        this.ctx.font = 'bold 28px Courier New';
        this.ctx.fillStyle = '#a8d5e2';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'rgba(168, 213, 226, 0.8)';
        this.ctx.fillText('PRESS SPACE TO START', this.canvas.width / 2, this.canvas.height / 2 + 60);
        
        this.ctx.restore();
    }

    spawnEnemy() {
        // Increased margin to prevent text cutoff
        // Account for enemy width (40px) plus potential long word extending ~100px on each side
        const margin = 120;
        const x = margin + Math.random() * (this.canvas.width - margin * 2);
        const y = -50;
        
        // Speed increases very gradually with rounds - cap the increase
        const baseSpeed = 0.25 + Math.min(this.round - 1, 20) * 0.02; // Cap at round 21, slower increase
        const speed = baseSpeed + Math.random() * 0.05;
        
        // Get a word that hasn't been used this round
        const excludedWords = Array.from(this.usedWordsThisRound);
        const word = getRandomWord(this.round, excludedWords);
        this.usedWordsThisRound.add(word);
        
        const enemy = new Enemy(x, y, word, speed, false);
        
        this.enemies.push(enemy);
        this.enemiesSpawned++;
    }
    
    spawnBoss() {
        const x = this.canvas.width / 2 - 60; // Center the boss (boss width is 120)
        const y = -100;
        const speed = 0.15; // Bosses move slower
        
        // Get a boss word (bosses don't spawn multiple times per round, so no need to track)
        const excludedWords = Array.from(this.usedWordsThisRound);
        const word = getBossWord(this.round, excludedWords);
        this.usedWordsThisRound.add(word);
        
        const boss = new Enemy(x, y, word, speed, true);
        
        this.enemies.push(boss);
        this.bossEnemy = boss;
        this.enemiesSpawned = 1;
    }

    handleTyping(char) {
        if (this.gameState !== 'playing') return;
        
        // If we have an active enemy, continue typing it
        if (this.activeEnemy && !this.activeEnemy.isComplete()) {
            if (this.activeEnemy.checkTyping(char)) {
                if (this.activeEnemy.isComplete()) {
                    this.shootEnemy(this.activeEnemy);
                }
                return true;
            } else {
                // Wrong character, reset
                this.activeEnemy.active = false;
                this.activeEnemy = null;
                return false;
            }
        }
        
        // Find new enemy that starts with this character
        for (let enemy of this.enemies) {
            if (enemy.typedChars === 0 && enemy.word[0].toLowerCase() === char.toLowerCase()) {
                enemy.checkTyping(char);
                enemy.active = true;
                this.activeEnemy = enemy;
                
                // Create lock-on indicator animation
                this.createLockOnIndicator(enemy);
                
                if (enemy.isComplete()) {
                    this.shootEnemy(enemy);
                }
                return true;
            }
        }
        
        return false;
    }

    shootEnemy(enemy) {
        // Shoot bullet towards enemy - bullet will track and destroy it on impact
        const bullet = this.player.shoot(
            enemy.x + enemy.width / 2, 
            enemy.y + enemy.height / 2,
            enemy
        );
        this.bullets.push(bullet);
        
        // Play shoot sound
        this.audioManager.playShoot();
        
        // Mark enemy as targeted but don't destroy yet
        enemy.active = false;
        
        // Clear active enemy
        if (this.activeEnemy === enemy) {
            this.activeEnemy = null;
        }
    }
    
    hitEnemy(enemy) {
        // Called when bullet reaches enemy
        const destroyed = enemy.takeDamage();
        
        if (destroyed) {
            // Enemy is destroyed
            const index = this.enemies.indexOf(enemy);
            if (index > -1) {
                this.enemies.splice(index, 1);
            }
            
            // Update score
            const points = enemy.word.length * 10 * (enemy.isBoss ? 2 : 1);
            this.score += points;
            this.enemiesDestroyed++;
            this.updateScoreDisplay();
            
            // Clear boss reference
            if (enemy.isBoss) {
                this.bossEnemy = null;
            }
        } else {
            // Boss took damage but not destroyed - give it a new word
            const newWord = getBossWord(this.round);
            enemy.resetWord(newWord);
            
            // Remove old lock-on indicator since boss has a new word
            this.removeLockOnIndicator(enemy);
        }
    }

    destroyEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            // Create explosion particles
            this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            
            // Shoot bullet
            const bullet = this.player.shoot(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
            this.bullets.push(bullet);
            
            // Remove enemy
            this.enemies.splice(index, 1);
            
            // Update score
            const points = enemy.word.length * 10;
            this.score += points;
            this.enemiesDestroyed++;
            this.updateScoreDisplay();
            
            // Clear active enemy
            if (this.activeEnemy === enemy) {
                this.activeEnemy = null;
            }
        }
    }

    createExplosion(x, y, isBoss = false) {
        const colors = ['#a8d5e2', '#7bb3d4', '#d4a87b'];
        const particleCount = isBoss ? 25 : 15;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = (isBoss ? 3 : 2) + Math.random() * 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: (isBoss ? 3 : 2) + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 30 + Math.random() * 20,
                maxLife: 50,
                alpha: 1
            });
        }
        
        // Trigger screen shake (stronger for boss)
        if (isBoss) {
            this.triggerShake(12, 15);
            this.triggerFlash('#ff9999', 0.3); // Red flash for boss
        } else {
            this.triggerShake(6, 10);
            this.triggerFlash('#a8d5e2', 0.2); // Blue flash for regular
        }
    }
    
    createLockOnIndicator(enemy) {
        // Create animated brackets that fly toward the enemy
        this.lockOnIndicators.push({
            enemy: enemy,
            progress: 0, // 0 to 1, controls the animation
            startTime: Date.now(),
            rotation: 0, // Rotation angle in radians
            currentOffset: 60 // Current distance from enemy (will lerp)
        });
        
        // Play click sound for lock-on
        this.audioManager.playClick();
    }
    
    removeLockOnIndicator(enemy) {
        // Remove any lock-on indicators for the specified enemy
        this.lockOnIndicators = this.lockOnIndicators.filter(indicator => indicator.enemy !== enemy);
    }
    
    drawLockOnIndicators() {
        if (this.lockOnIndicators.length === 0) return;
        
        this.ctx.save();
        
        this.lockOnIndicators.forEach(indicator => {
            // Handle destroying indicators differently
            if (indicator.destroying) {
                // Store last known enemy position for destruction animation
                if (!indicator.lastX) {
                    indicator.lastX = indicator.enemy ? indicator.enemy.x + indicator.enemy.width / 2 : 0;
                    indicator.lastY = indicator.enemy ? indicator.enemy.y + indicator.enemy.height / 2 : 0;
                }
                
                const centerX = indicator.lastX;
                const centerY = indicator.lastY;
                const destroyProgress = indicator.destroyProgress;
                
                // Spread outward and fade
                const spreadOffset = indicator.currentOffset + (destroyProgress * 80); // Spread 80px outward
                const opacity = (1 - destroyProgress) * 0.8; // Fade from 0.8 to 0
                
                const bracketSize = 15;
                
                this.ctx.strokeStyle = `rgba(255, 100, 100, ${opacity})`;
                this.ctx.lineWidth = 2;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = `rgba(255, 100, 100, ${opacity})`;
                
                // Save context for rotation
                this.ctx.save();
                this.ctx.translate(centerX, centerY);
                this.ctx.rotate(indicator.rotation);
                
                // Draw four corner brackets (spreading outward)
                this.ctx.beginPath();
                this.ctx.moveTo(-spreadOffset, -spreadOffset);
                this.ctx.lineTo(-spreadOffset - bracketSize, -spreadOffset);
                this.ctx.moveTo(-spreadOffset, -spreadOffset);
                this.ctx.lineTo(-spreadOffset, -spreadOffset - bracketSize);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(spreadOffset, -spreadOffset);
                this.ctx.lineTo(spreadOffset + bracketSize, -spreadOffset);
                this.ctx.moveTo(spreadOffset, -spreadOffset);
                this.ctx.lineTo(spreadOffset, -spreadOffset - bracketSize);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(-spreadOffset, spreadOffset);
                this.ctx.lineTo(-spreadOffset - bracketSize, spreadOffset);
                this.ctx.moveTo(-spreadOffset, spreadOffset);
                this.ctx.lineTo(-spreadOffset, spreadOffset + bracketSize);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(spreadOffset, spreadOffset);
                this.ctx.lineTo(spreadOffset + bracketSize, spreadOffset);
                this.ctx.moveTo(spreadOffset, spreadOffset);
                this.ctx.lineTo(spreadOffset, spreadOffset + bracketSize);
                this.ctx.stroke();
                
                this.ctx.restore();
                return;
            }
            
            if (!indicator.enemy) return;
            
            const enemy = indicator.enemy;
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;
            
            // Animation progress from 0 to 1
            const progress = indicator.progress;
            
            // Phase 1: Travel from player to enemy (0 to 0.4)
            let centerX, centerY;
            if (progress < 0.4) {
                // Lerp from player to enemy
                const travelProgress = progress / 0.4; // 0 to 1
                centerX = playerCenterX + (enemyCenterX - playerCenterX) * travelProgress;
                centerY = playerCenterY + (enemyCenterY - playerCenterY) * travelProgress;
            } else {
                // At enemy position
                centerX = enemyCenterX;
                centerY = enemyCenterY;
            }
            
            // Phase 2: Tighten brackets based on typing completion (progress 0.4 to 1.0)
            // Calculate how much of the word has been typed
            const typingProgress = enemy.typedChars / enemy.word.length;
            
            // Use the smoothly lerped currentOffset from the indicator
            let currentOffset;
            
            if (progress < 0.4) {
                // During travel phase, keep brackets at max offset
                currentOffset = 60;
            } else {
                // After arrival, use the lerped offset
                currentOffset = indicator.currentOffset;
            }
            
            // Size of brackets
            const bracketSize = 15;
            
            // Opacity increases as brackets get closer during travel, then stays bright
            let opacity;
            if (progress < 0.4) {
                opacity = 0.3 + (progress / 0.4) * 0.5; // 0.3 to 0.8 during travel
            } else {
                opacity = 0.8 + typingProgress * 0.2; // 0.8 to 1.0 based on typing
            }
            
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${opacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = 'rgba(255, 100, 100, 0.8)';
            
            // Save context for rotation
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(indicator.rotation);
            
            // Draw four corner brackets (now rotated around center)
            // Top-left bracket
            this.ctx.beginPath();
            this.ctx.moveTo(-currentOffset, -currentOffset);
            this.ctx.lineTo(-currentOffset - bracketSize, -currentOffset);
            this.ctx.moveTo(-currentOffset, -currentOffset);
            this.ctx.lineTo(-currentOffset, -currentOffset - bracketSize);
            this.ctx.stroke();
            
            // Top-right bracket
            this.ctx.beginPath();
            this.ctx.moveTo(currentOffset, -currentOffset);
            this.ctx.lineTo(currentOffset + bracketSize, -currentOffset);
            this.ctx.moveTo(currentOffset, -currentOffset);
            this.ctx.lineTo(currentOffset, -currentOffset - bracketSize);
            this.ctx.stroke();
            
            // Bottom-left bracket
            this.ctx.beginPath();
            this.ctx.moveTo(-currentOffset, currentOffset);
            this.ctx.lineTo(-currentOffset - bracketSize, currentOffset);
            this.ctx.moveTo(-currentOffset, currentOffset);
            this.ctx.lineTo(-currentOffset, currentOffset + bracketSize);
            this.ctx.stroke();
            
            // Bottom-right bracket
            this.ctx.beginPath();
            this.ctx.moveTo(currentOffset, currentOffset);
            this.ctx.lineTo(currentOffset + bracketSize, currentOffset);
            this.ctx.moveTo(currentOffset, currentOffset);
            this.ctx.lineTo(currentOffset, currentOffset + bracketSize);
            this.ctx.stroke();
            
            // Restore context
            this.ctx.restore();
        });
        
        this.ctx.restore();
    }
    
    triggerShake(amount, duration) {
        this.shakeAmount = amount;
        this.shakeDuration = duration;
    }
    
    triggerFlash(color, intensity) {
        this.flashColor = color;
        this.flashAlpha = intensity;
    }

    completeRound() {
        this.gameState = 'roundComplete';
        
        // Note: star deceleration already started when round completion was detected
        
        // Calculate typing speed (WPM)
        const roundDuration = (Date.now() - this.roundStartTime) / 1000 / 60; // in minutes
        const wordsTyped = this.correctCharactersTyped / 5; // Standard: 5 characters = 1 word
        const wpm = Math.round(wordsTyped / roundDuration);
        const accuracy = this.totalCharactersTyped > 0 
            ? Math.round((this.correctCharactersTyped / this.totalCharactersTyped) * 100)
            : 100;
        
        // Calculate time bonus multiplier based on round completion time
        const roundTimeSeconds = (Date.now() - this.roundStartTime) / 1000;
        let timeMultiplier = 1.0;
        
        // Award multiplier based on speed
        // < 15 seconds: 3x, < 30 seconds: 2x, < 45 seconds: 1.5x, < 60 seconds: 1.25x
        if (roundTimeSeconds < 15) {
            timeMultiplier = 3.0;
        } else if (roundTimeSeconds < 30) {
            timeMultiplier = 2.0;
        } else if (roundTimeSeconds < 45) {
            timeMultiplier = 1.5;
        } else if (roundTimeSeconds < 60) {
            timeMultiplier = 1.25;
        }
        
        // Calculate accuracy multiplier (penalty for low accuracy)
        // 95%+: 1.0x, 90-94%: 0.9x, 80-89%: 0.75x, 70-79%: 0.5x, <70%: 0.25x
        let accuracyMultiplier = 1.0;
        if (accuracy < 70) {
            accuracyMultiplier = 0.25;
        } else if (accuracy < 80) {
            accuracyMultiplier = 0.5;
        } else if (accuracy < 90) {
            accuracyMultiplier = 0.75;
        } else if (accuracy < 95) {
            accuracyMultiplier = 0.9;
        }
        
        // Apply time bonus to score
        const basePoints = this.isBossRound ? 500 : this.enemiesDestroyed * 100;
        const timeBonus = Math.round(basePoints * (timeMultiplier - 1));
        
        // Apply accuracy multiplier to total (base + time bonus)
        const totalBeforeAccuracy = basePoints + timeBonus;
        const accuracyPenalty = Math.round(totalBeforeAccuracy * (1 - accuracyMultiplier));
        const finalPoints = Math.round(totalBeforeAccuracy * accuracyMultiplier);
        
        this.score += finalPoints;
        
        document.getElementById('roundComplete').classList.remove('hidden');
        
        const roundScoreElement = document.getElementById('roundScore');
        roundScoreElement.textContent = `SCORE: ${this.score}`;
        
        // Add pulse animation to score if time bonus >= 2x and no accuracy penalty
        if (timeMultiplier >= 2.0 && accuracyPenalty === 0) {
            roundScoreElement.classList.add('score-pulse');
        } else {
            roundScoreElement.classList.remove('score-pulse');
        }
        
        document.getElementById('roundStats').textContent = 
            `ENEMIES DESTROYED: ${this.enemiesDestroyed} | HULL: ${this.player.health}% | WPM: ${wpm} | ACCURACY: ${accuracy}%`;
        
        let bonusHTML = '';
        if (timeBonus > 0) {
            bonusHTML += `<span class="time-bonus">TIME BONUS: +${timeBonus} (${timeMultiplier}x)</span>`;
        }
        if (accuracyPenalty > 0) {
            bonusHTML += `<span class="accuracy-penalty">ACCURACY PENALTY: -${accuracyPenalty} (${accuracyMultiplier}x)</span>`;
        }
        document.getElementById('roundBonus').innerHTML = bonusHTML;
    }

    nextRound() {
        this.round++;
        
        // Start star acceleration for new round
        this.starAccelerating = true;
        
        // Check if this should be a boss round (every 5th round)
        this.isBossRound = (this.round % 5 === 0);
        
        // Clear used words for new round
        this.usedWordsThisRound.clear();
        
        this.enemiesSpawned = 0;
        this.enemiesDestroyed = 0;
        this.spawnTimer = 0;
        this.spawnInterval = Math.max(80, 140 - this.round * 3); // Slower spawn rate increase
        
        if (this.isBossRound) {
            this.enemiesPerRound = 1; // Just the boss
            this.spawnBoss();
        } else {
            // Increase enemy count by 1 every 5 rounds (after each boss)
            this.enemiesPerRound = Math.min(5 + Math.floor(this.round / 5), 12); // Max 12 enemies
        }
        
        // Reset typing stats for new round
        this.roundStartTime = Date.now();
        this.totalCharactersTyped = 0;
        this.correctCharactersTyped = 0;
        
        this.gameState = 'playing';
        document.getElementById('roundComplete').classList.add('hidden');
        this.updateRoundDisplay();
    }

    endGame() {
        this.gameState = 'gameOver';
        this.audioManager.stopMusic();
        
        // Stop star acceleration (they will decelerate)
        this.starAccelerating = false;
        
        // Calculate overall stats
        const gameDuration = (Date.now() - this.gameStartTime) / 1000 / 60; // in minutes
        const wordsTyped = this.overallCorrectCharactersTyped / 5; // Standard: 5 characters = 1 word
        const overallWpm = Math.round(wordsTyped / gameDuration);
        const overallAccuracy = this.overallCharactersTyped > 0 
            ? Math.round((this.overallCorrectCharactersTyped / this.overallCharactersTyped) * 100)
            : 100;
        
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('finalScore').textContent = `FINAL SCORE: ${this.score}`;
        document.getElementById('finalStats').textContent = `WPM: ${overallWpm} | ACCURACY: ${overallAccuracy}%`;
    }

    restart() {
        // Reset game state
        this.round = 1;
        this.score = 0;
        this.enemiesDestroyed = 0;
        this.enemiesPerRound = 5;
        this.enemiesSpawned = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 140;
        
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.activeEnemy = null;
        
        // Reset star speed
        this.starSpeedMultiplier = 0;
        this.starAccelerating = true; // Will accelerate when game starts
        
        // Reset boss mode
        this.isBossRound = false;
        this.bossEnemy = null;
        
        // Clear used words
        this.usedWordsThisRound = new Set();
        
        // Reset typing stats
        this.roundStartTime = Date.now();
        this.totalCharactersTyped = 0;
        this.correctCharactersTyped = 0;
        
        // Reset overall game stats
        this.gameStartTime = Date.now();
        this.overallCharactersTyped = 0;
        this.overallCorrectCharactersTyped = 0;
        
        this.player.reset();
        this.gameState = 'playing';
        
        // Restart music
        this.audioManager.startMusic();
        
        document.getElementById('gameOver').classList.add('hidden');
        
        this.updateRoundDisplay();
        this.updateScoreDisplay();
        this.updateHealthDisplay();
    }

    updateRoundDisplay() {
        const roundText = this.isBossRound ? `ROUND: ${this.round} [BOSS]` : `ROUND: ${this.round}`;
        document.getElementById('round').textContent = roundText;
    }

    updateScoreDisplay() {
        document.getElementById('score').textContent = `SCORE: ${this.score}`;
    }

    updateHealthDisplay() {
        document.getElementById('health').textContent = `HULL: ${this.player.health}%`;
    }

    trackTyping(inputLength, isCorrect) {
        this.totalCharactersTyped++;
        this.overallCharactersTyped++;
        if (isCorrect) {
            this.correctCharactersTyped++;
            this.overallCorrectCharactersTyped++;
        }
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    startGame() {
        if (this.gameState === 'start') {
            this.gameState = 'playing';
            this.roundStartTime = Date.now();
            this.gameStartTime = Date.now();
            
            // Reset star speed for new game and start accelerating
            this.starSpeedMultiplier = 0;
            this.starAccelerating = true;
            
            // Start background music
            this.audioManager.startMusic();
        }
    }
}
