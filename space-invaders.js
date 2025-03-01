class SpaceInvaders {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.context = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Game settings
        this.playerWidth = 80;  // Made wider for the LNG boat
        this.playerHeight = 40;
        this.bulletWidth = 3;
        this.bulletHeight = 15;
        this.alienWidth = 40;
        this.alienHeight = 25;
        this.alienSpacing = 30;
        this.alienRows = 4;
        this.alienCols = 8;
        this.alienMoveSpeed = 1;
        this.alienDropDistance = 30;
        this.bulletSpeed = 7;
        this.playerSpeed = 5;
        
        // Initialize game state
        this.reset();
        
        // Bind event listeners
        this.bindEvents();
    }
    
    reset() {
        // Player state
        this.playerX = (this.canvas.width - this.playerWidth) / 2;
        this.lives = 3;
        this.score = 0;
        this.highScore = localStorage.getItem('highScore') || 0;
        
        // Game state
        this.isRunning = false;
        this.gameOver = false;
        this.keys = {};
        
        // Bullets and aliens
        this.bullets = [];
        this.alienBullets = [];
        this.aliens = this.createAliens();
        this.alienDirection = 1;
        this.alienStepDown = false;
        this.lastAlienShot = 0;
        
        // Update display
        this.updateScoreDisplay();
    }
    
    createAliens() {
        const aliens = [];
        const startX = (this.canvas.width - (this.alienCols * (this.alienWidth + this.alienSpacing))) / 2;
        const startY = 50;
        
        for (let row = 0; row < this.alienRows; row++) {
            for (let col = 0; col < this.alienCols; col++) {
                aliens.push({
                    x: startX + col * (this.alienWidth + this.alienSpacing),
                    y: startY + row * (this.alienHeight + this.alienSpacing),
                    width: this.alienWidth,
                    height: this.alienHeight,
                    type: row
                });
            }
        }
        return aliens;
    }
    
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                this.shoot();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
    }
    
    startGame() {
        if (!this.isRunning) {
            this.reset();
            this.isRunning = true;
            this.gameLoop();
        }
    }
    
    shoot() {
        if (!this.isRunning || this.gameOver) return;
        
        this.bullets.push({
            x: this.playerX + this.playerWidth / 2 - this.bulletWidth / 2,
            y: this.canvas.height - this.playerHeight - 10,
            width: this.bulletWidth,
            height: this.bulletHeight
        });
    }
    
    alienShoot() {
        if (this.aliens.length === 0) return;
        
        const now = Date.now();
        if (now - this.lastAlienShot < 1000) return;
        
        const shootingAlien = this.aliens[Math.floor(Math.random() * this.aliens.length)];
        this.alienBullets.push({
            x: shootingAlien.x + shootingAlien.width / 2,
            y: shootingAlien.y + shootingAlien.height,
            width: this.bulletWidth,
            height: this.bulletHeight
        });
        
        this.lastAlienShot = now;
    }
    
    updatePlayer() {
        if (this.keys['ArrowLeft']) {
            this.playerX = Math.max(0, this.playerX - this.playerSpeed);
        }
        if (this.keys['ArrowRight']) {
            this.playerX = Math.min(this.canvas.width - this.playerWidth, this.playerX + this.playerSpeed);
        }
    }
    
    updateBullets() {
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= this.bulletSpeed;
            return bullet.y + bullet.height > 0;
        });
        
        this.alienBullets = this.alienBullets.filter(bullet => {
            bullet.y += this.bulletSpeed;
            return bullet.y < this.canvas.height;
        });
    }
    
    updateAliens() {
        let touchedEdge = false;
        
        this.aliens.forEach(alien => {
            if (this.alienStepDown) {
                alien.y += this.alienDropDistance;
            } else {
                alien.x += this.alienMoveSpeed * this.alienDirection;
            }
            
            if (!this.alienStepDown) {
                if (alien.x <= 0 || alien.x + this.alienWidth >= this.canvas.width) {
                    touchedEdge = true;
                }
            }
        });
        
        if (this.alienStepDown) {
            this.alienStepDown = false;
        } else if (touchedEdge) {
            this.alienDirection *= -1;
            this.alienStepDown = true;
        }
        
        if (this.aliens.some(alien => alien.y + alien.height >= this.canvas.height - this.playerHeight)) {
            this.gameOver = true;
        }
    }
    
    checkCollisions() {
        this.bullets.forEach((bullet, bulletIndex) => {
            this.aliens.forEach((alien, alienIndex) => {
                if (this.checkCollision(bullet, alien)) {
                    this.bullets.splice(bulletIndex, 1);
                    this.aliens.splice(alienIndex, 1);
                    this.score += (this.alienRows - Math.floor(alien.type)) * 10;
                    this.updateScoreDisplay();
                }
            });
        });
        
        this.alienBullets.forEach((bullet, index) => {
            if (this.checkCollision(bullet, {
                x: this.playerX,
                y: this.canvas.height - this.playerHeight,
                width: this.playerWidth,
                height: this.playerHeight
            })) {
                this.alienBullets.splice(index, 1);
                this.lives--;
                this.updateScoreDisplay();
                
                if (this.lives <= 0) {
                    this.gameOver = true;
                }
            }
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        document.getElementById('highScore').textContent = this.highScore;
    }
    
    drawBoat(x, y, width, height, isPlayer = false) {
        if (isPlayer) {
            // Draw LNG tanker
            this.context.fillStyle = '#33ff33';
            
            // Draw hull
            this.context.beginPath();
            this.context.moveTo(x, y + height);
            this.context.lineTo(x, y + height * 0.4);
            this.context.lineTo(x + width * 0.1, y + height * 0.4);
            this.context.lineTo(x + width * 0.2, y + height * 0.2);
            this.context.lineTo(x + width * 0.8, y + height * 0.2);
            this.context.lineTo(x + width * 0.9, y + height * 0.4);
            this.context.lineTo(x + width, y + height * 0.4);
            this.context.lineTo(x + width, y + height);
            this.context.fill();
            
            // Draw bridge/control tower
            this.context.fillRect(
                x + width * 0.7,
                y + height * 0.2,
                width * 0.15,
                height * 0.3
            );
            
            // Draw "LNG" text
            this.context.fillStyle = '#000';
            this.context.font = 'bold 16px Arial';
            this.context.textAlign = 'center';
            this.context.textBaseline = 'middle';
            this.context.fillText('LNG', x + width/2, y + height * 0.6);
        } else {
            // Draw enemy sailing boat
            this.context.fillStyle = '#ff6666';
            
            // Draw hull
            this.context.beginPath();
            this.context.moveTo(x, y + height);
            this.context.lineTo(x + width * 0.4, y + height * 0.6);
            this.context.lineTo(x + width * 0.6, y + height * 0.6);
            this.context.lineTo(x + width, y + height);
            this.context.fill();
            
            // Draw sail
            this.context.beginPath();
            this.context.moveTo(x + width * 0.5, y + height * 0.6);  // Mast bottom
            this.context.lineTo(x + width * 0.5, y);                 // Mast top
            this.context.lineTo(x + width * 0.8, y + height * 0.4);  // Sail edge
            this.context.lineTo(x + width * 0.5, y + height * 0.4);  // Back to mast
            this.context.fill();
        }
    }
    
    draw() {
        // Clear canvas with ocean blue background
        this.context.fillStyle = '#001933';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw player boat
        this.drawBoat(
            this.playerX,
            this.canvas.height - this.playerHeight,
            this.playerWidth,
            this.playerHeight,
            true
        );
        
        // Draw enemy boats
        this.aliens.forEach(alien => {
            this.drawBoat(
                alien.x,
                alien.y,
                alien.width,
                alien.height,
                false
            );
        });
        
        // Draw bullets (as torpedoes)
        this.context.fillStyle = '#33ff33';
        this.bullets.forEach(bullet => {
            this.context.beginPath();
            this.context.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 3, 0, Math.PI * 2);
            this.context.fill();
        });
        
        // Draw alien bullets
        this.context.fillStyle = '#ff3333';
        this.alienBullets.forEach(bullet => {
            this.context.beginPath();
            this.context.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 3, 0, Math.PI * 2);
            this.context.fill();
        });
        
        // Draw game over message
        if (this.gameOver) {
            this.context.fillStyle = '#33ff33';
            this.context.font = '48px "Courier New"';
            this.context.textAlign = 'center';
            this.context.fillText(
                'GAME OVER',
                this.canvas.width / 2,
                this.canvas.height / 2
            );
        }
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        if (!this.gameOver) {
            this.updatePlayer();
            this.updateBullets();
            this.updateAliens();
            this.checkCollisions();
            
            if (Math.random() < 0.02) {
                this.alienShoot();
            }
            
            if (this.aliens.length === 0) {
                this.aliens = this.createAliens();
                this.alienMoveSpeed += 0.5;
            }
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
window.onload = () => {
    new SpaceInvaders();
}; 