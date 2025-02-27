// Front-end React component
import React, { useState, useEffect } from 'react';
import { FiUpload, FiMap, FiInfo } from 'react-icons/fi';
import { Three } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { PerspectiveCamera } from 'three/cameras/PerspectiveCamera';
import { Mesh } from 'three/objects/Mesh';
import { Text } from 'three/addons/text/Text';
import 'three/style.css';
import { BufferGeometry, BufferAttribute } from 'three/core/gpu/BufferGeometry';
import { MeshStandardMaterial, MeshBasicMaterial } from 'three/materials';
import { load } from 'three/loaders/GLTFLoader';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import { PHOTON_MAP } from 'three/addons/physics/PhotonMap';
import { Physics } from 'three/addons/physics/Physics';
import { Text3D } from 'three/addons/text/Text3D';
import { TWEEN } from 'three';

// Database configuration
const config = {
    host: 'your-database-host',
    database: 'your-database-name',
    user: 'your-database-user',
    password: 'your-database-password',
    port: 5432
};

// Initialize Firebase
const firebase = require('firebase');
firebase.initializeApp({
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-firebase-project.firebaseapp.com',
    databaseURL: 'your-firebase-database-url',
    projectId: 'your-firebase-project-id',
    storageBucket: 'your-firebase-storage-bucket.appspot.com',
    messagingSenderId: 'your-messaging-send-id',
    appId: 'your-app-id'
});

// Tour model
class Tour {
    constructor() {
        this.id = uuid();
        this.scenes = [];
        this.hotspots = [];
        this.transitions = [];
    }
}

// Create a virtual tour
function createVirtualTour() {
    const tour = new Tour();
    tour.scenes.push({
        id: 'scene1',
        title: 'Scene 1',
        description: 'First scene of the tour',
        background: 'scene1-bg.jpg'
    });
    tour.hotspots.push({
        id: 'hotspot1',
        position: [0, 0, 0],
        description: 'Hotspot 1 description',
        type: 'image'
    });
    tour.transitions.push({
        from: 'scene1',
        to: 'scene2',
        type: 'transition'
    });
    return tour;
}

// Save tour to MongoDB
async function saveTour(tour) {
    const conn = await pg.connect(config);
    try {
        const query = 'INSERT INTO tours (id, scenes, hotspots, transitions) VALUES ($1)';
        const result = await conn.query(query, [tour.id, tour.scenes, tour.hotspots, tour.transitions]);
        return result.rows[0];
    } catch (error) {
        console.error('Error saving tour:', error);
        return null;
    } finally {
        conn.end();
    }
}

// Load tour from MongoDB
async function loadTour(id) {
    const conn = await pg.connect(config);
    try {
        const query = 'SELECT * FROM tours WHERE id = $1';
        const result = await conn.query(query, [id]);
        return result.rows[0] ? new Tour(result.rows[0]) : null;
    } catch (error) {
        console.error('Error loading tour:', error);
        return null;
    } finally {
        conn.end();
    }
}

// React component for the tour creator
function TourCreator() {
    const [tour, setTour] = useState(new Tour());
    const [hotspots, setHotspots] = useState([]);
    const [scenes, setScenes] = useState([]);
    const [selectedScene, setSelectedScene] = useState('scene1');
    const [newHotspot, setNewHotspot] = useState('');
    const [newSceneName, setNewSceneName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newBackground, setNewBackground] = useState('default-bg.jpg');
    const [isEditing, setIsEditing] = useState(false);
    const [isPreview, setIsPreview] = useState(false);

    useEffect(() => {
        loadTourData();
    }, []);

    const loadTourData = async () => {
        const tour = await loadTour('tour-id');
        if (tour) {
            setTour(tour);
            setScenes(tour.scenes);
            setHotspots(tour.hotspots);
        }
    };

    const handleAddHotspot = () => {
        if (newHotspot.trim()) {
            const hotspot = {
                id: Date.now(),
                position: [0, 0, 0],
                description: newHotspot,
                type: 'image'
            };
            setHotspots([...hotspots, hotspot]);
            setNewHotspot('');
        }
    };

    const handleAddScene = () => {
        if (newSceneName.trim()) {
            const scene = {
                id: Date.now(),
                title: newSceneName,
                description: newDescription,
                background: newBackground,
                hotspots: hotspots.filter(h => h.id === scene.id)
            };
            setScenes([...scenes, scene]);
            setNewSceneName('');
            setNewDescription('');
            setNewBackground('');
        }
    };

    return (
        <div className="container">
            <header>
                <h1>Virtual Tour Creator</h1>
            </header>

            <div className="tour-section">
                <div className="scenes-list">
                    <h2>Scenes</h2>
                    <input
                        type="text"
                        value={newSceneName}
                        onChange={(e) => setNewSceneName(e.target.value)}
                        placeholder="Scene name"
                    />
                    <input
                        type="text"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Description"
                    />
                    <input
                        type="text"
                        value={newBackground}
                        onChange={(e) => setNewBackground(e.target.value)}
                        placeholder="Background image"
                    />
                    <button onClick={handleAddScene}>
                        <FiMap size={24} /> Add Scene
                    </button>
                </div>

                <div className="hotspots-list">
                    <h2>Hotspots</h2>
                    <input
                        type="text"
                        value={newHotspot}
                        onChange={(e) => setNewHotspot(e.target.value)}
                        placeholder="Hotspot description"
                    />
                    <button onClick={handleAddHotspot}>
                        <FiInfo size={24} /> Add Hotspot
                    </button>
                </div>

                <div className="tour-config">
                    <h2>Tour Configuration</h2>
                    <select
                        value={selectedScene}
                        onChange={(e) => setSelectedScene(e.target.value)}
                    >
                        {scenes.map(scene => (
                            <option key={scene.id} value={scene.id}>
                                {scene.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="preview-section">
                <h2>Preview</h2>
                <button onClick={() => setIsPreview(!isPreview)}>
                    {isPreview ? 'Edit' : 'Preview'}
                </button>
                {isPreview && (
                    <div className="preview-content">
                        {/* Render VR preview here */}
                    </div>
                )}
            </div>
        </div>
    );
}

// Main application initialization
function main() {
    const app = document.getElementById('app');
    app.appendChild(new TourCreator());
}

// Initialize Three.js scene
function initThreeScene() {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    camera.position.z = 5;

    // Add a simple 3D object
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Add event listener for window resize
    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        TWEEN.update();
        renderer.render(scene, camera);
    }
    animate();
}

// Initialize the application
initThreeScene();