// Package.json dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "touch-emulator": "^1.0.8"
  }
}

// Game mechanics (game.js)
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size based on device
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Touch controls
const touchControls = {
  left: false,
  right: false,
  up: false,
  down: false
};

canvas.addEventListener('touchstart', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.touches[0].clientX - rect.left;
  const y = e.touches[0].clientY - rect.top;

  if (x < canvas.width / 3) {
    touchControls.left = true;
  } else if (x < 2 * canvas.width / 3) {
    touchControls.up = true;
  } else {
    touchControls.right = true;
  }
});

canvas.addEventListener('touchend', () => {
  Object.keys(touchControls).forEach(key => {
    touchControls[key] = false;
  });
});

// Player object
const player = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  width: 40,
  height: 40,
  speed: 5,
  score: 0,
  lives: 3
};

// Enemy objects
const enemies = [];
for (let i = 0; i < 5; i++) {
  enemies.push({
    x: Math.random() * (canvas.width - 40),
    y: Math.random() * (canvas.height / 2),
    width: 40,
    height: 40,
    speed: 2,
    direction: Math.random() * Math.PI * 2
  });
}

// Game loop
function update() {
  // Player movement
  if (touchControls.left) {
    player.x -= player.speed;
  }
  if (touchControls.right) {
    player.x += player.speed;
  }
  if (touchControls.up) {
    player.y -= player.speed;
  }
  if (touchControls.down) {
    player.y += player.speed;
  }

  // Keep player within canvas bounds
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  // Enemy movement
  enemies.forEach(enemy => {
    enemy.x += Math.cos(enemy.direction) * enemy.speed;
    enemy.y += Math.sin(enemy.direction) * enemy.speed;

    // Bounce off walls
    if (enemy.x < 0 || enemy.x > canvas.width - enemy.width) {
      enemy.direction = Math.PI - enemy.direction;
    }
    if (enemy.y < 0 || enemy.y > canvas.height - enemy.height) {
      enemy.direction = -enemy.direction;
    }

    // Collision detection with player
    if (checkCollision(player, enemy)) {
      player.lives--;
      if (player.lives === 0) {
        gameOver();
      }
    }
  });

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawEnemies();

  requestAnimationFrame(update);
}

function drawPlayer() {
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawEnemies() {
  ctx.fillStyle = '#f44336';
  enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });
}

function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width &&
         rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height &&
         rect1.y + rect1.height > rect2.y;
}

function gameOver() {
  ctx.fillStyle = '#000000';
  ctx.font = '48px Arial';
  ctx.fillText('Game Over!', canvas.width / 2 - 120, canvas.height / 2);
  ctx.font = '24px Arial';
  ctx.fillText('Refresh to play again', canvas.width / 2 - 100, canvas.height / 2 + 40);
}

// Start the game
update();

// React component (App.js)
import React from 'react';

function Game() {
  return (
    <div>
      <h1>2D Game Development</h1>
      <canvas id="gameCanvas" style={{ border: '1px solid black' }} />
    </div>
  );
}

export default Game;