export class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = 60;
        this.height = 40;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - this.height - 20;
        this.maxHealth = 100;
        this.health = this.maxHealth;
    }

    draw(ctx) {
        // Draw mothership with console-like aesthetic
        ctx.save();
        
        // Ship body (main hull)
        ctx.fillStyle = '#7bb3d4';
        ctx.strokeStyle = '#a8d5e2';
        ctx.lineWidth = 2;
        
        // Main body
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Cockpit
        ctx.fillStyle = '#a8d5e2';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings detail
        ctx.strokeStyle = '#a8d5e2';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + this.height - 10);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height - 10);
        ctx.stroke();
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(168, 213, 226, 0.5)';
        ctx.strokeStyle = '#a8d5e2';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
        
        // Health bar
        this.drawHealthBar(ctx);
    }

    drawHealthBar(ctx) {
        const barWidth = 100;
        const barHeight = 8;
        const barX = this.x + this.width / 2 - barWidth / 2;
        const barY = this.y + this.height + 10;
        
        // Background
        ctx.fillStyle = 'rgba(168, 213, 226, 0.2)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#7bb3d4';
        } else if (healthPercent > 0.3) {
            healthColor = '#d4a87b';
        } else {
            healthColor = '#d47b7b';
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#a8d5e2';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        return this.health <= 0;
    }

    reset() {
        this.health = this.maxHealth;
    }

    shoot(targetX, targetY, targetEnemy = null) {
        // Create bullet projectile
        return {
            x: this.x + this.width / 2,
            y: this.y,
            targetX: targetX,
            targetY: targetY,
            targetEnemy: targetEnemy,
            speed: 10
        };
    }
}
