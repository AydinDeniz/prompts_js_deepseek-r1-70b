// Import A-Frame
require('aframe');

// Initialize scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Game State Manager
class GameStateManager {
  constructor() {
    this.state = {
      score: 0,
      level: 1,
      playerPosition: new THREE.Vector3(0, 0, 0),
      activeEnemies: []
    };
  }

  updateState(newState) {
    this.state = { ...this.state, ...newState };
  }
}

// Player controls
document.addEventListener('keydown', (event) => {
  const speed = 0.1;
  switch(event.key) {
    case 'ArrowUp':
      camera.position.z -= speed;
      break;
    case 'ArrowDown':
      camera.position.z += speed;
      break;
    case 'ArrowLeft':
      camera.position.x -= speed;
      break;
    case 'ArrowRight':
      camera.position.x += speed;
      break;
  }
});

// Spawn enemies
function spawnEnemy() {
  const enemy = new THREE.Mesh(
    new THREE.SphereGeometry(0.5),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  enemy.position.set(
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5
  );
  scene.add(enemy);
  gameManager.updateState({ activeEnemies: [...gameManager.state.activeEnemies, enemy] });
}

// Game loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Initialize game
const gameManager = new GameStateManager();
spawnEnemy();
animate();