// Initialize Three.js scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load 360-degree image
function loadPanorama(imagePath) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(imagePath);
    const geometry = new THREE.SphereGeometry(500, 60, 60);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
}

// Add hotspot functionality
function addHotspot(position, description) {
    const hotspotGeometry = new THREE.SphereGeometry(1, 16, 16);
    const hotspotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const hotspot = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
    hotspot.position.set(...position);
    scene.add(hotspot);

    hotspot.addEventListener('click', () => {
        alert(description);
    });
}

// Transition between scenes
function transitionScenes(currentScene, nextScene) {
    const duration = 1000;
    const currentTime = Date.now();
    const transition = new THREE.Transition({
        startScene: currentScene,
        endScene: nextScene,
        duration: duration
    });
    scene.add(transition);
}

// Save tour configuration to MongoDB
async function saveTour(tourData) {
    try {
        const response = await fetch('/api/tours', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tourData),
        });

        if (!response.ok) {
            throw new Error('Failed to save tour');
        }

        const data = await response.json();
        console.log('Tour saved successfully:', data);
    } catch (error) {
        console.error('Error saving tour:', error);
    }
}

// Load tour configuration from MongoDB
async function loadTour(tourId) {
    try {
        const response = await fetch(`/api/tours/${tourId}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading tour:', error);
        return null;
    }
}

// Event listeners
document.getElementById('uploadImage').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            loadPanorama(event.target.result);
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('addHotspot').addEventListener('click', () => {
    const position = [
        parseFloat(document.getElementById('x').value),
        parseFloat(document.getElementById('y').value),
        parseFloat(document.getElementById('z').value)
    ];
    const description = document.getElementById('description').value;
    addHotspot(position, description);
});

document.getElementById('saveTour').addEventListener('click', () => {
    const tourData = {
        scenes: [],
        hotspots: []
    };
    saveTour(tourData);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    camera.lookAt(scene.position);
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});