// Import necessary libraries
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ARButton } from 'three/examples/jsm/controls/ARButton.js';

// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Add AR controls
const controls = new OrbitControls(camera, renderer.domElement);
const arButton = ARButton.createButton(renderer);
document.body.appendChild(arButton);

// Load 3D product model
const loader = new THREE.GLTFLoader();
loader.load('product.gltf', (gltf) => {
  const product = gltf.scene;
  product.scale.set(0.5, 0.5, 0.5);
  scene.add(product);
});

// Handle window resize
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
  renderer.render(scene, camera);
}
animate();

// Product placement logic
let product;
scene.addEventListener('click', (event) => {
  if (!product) {
    product = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    scene.add(product);
  }
});

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/arshopping', { useNewUrlParser: true, useUnifiedTopology: true });

// Product model
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  modelUrl: String
});

const Product = mongoose.model('Product', productSchema);

// API endpoints
app.use(cors());
app.use(express.json());

app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.json(product);
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});

// Add product to database
async function addProduct(productData) {
  try {
    const product = new Product(productData);
    await product.save();
    console.log('Product added successfully');
  } catch (err) {
    console.error(err);
  }
}

// Retrieve products from database
async function getProducts() {
  try {
    const products = await Product.find();
    return products;
  } catch (err) {
    console.error(err);
  }
}

// Request access to camera and sensors
async function initAR() {
  try {
    const session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['local-floor', 'bounded-floor', 'plane-detection', 'prismatic'],
      optionalFeatures: ['prismatic']
    });
    // Start AR session
    await session.updateRenderState({
      baseLayer: new XRWebGLLayer(session, renderer.context)
    });
  } catch (err) {
    console.error('Error initializing AR:', err);
  }
}

// Start AR experience
initAR();