import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import GUI from 'lil-gui';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Scene
const scene = new THREE.Scene();

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.z = 10;
scene.add(camera);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true // Enable antialiasing for smoother edges
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Enable damping (inertia)
controls.dampingFactor = 0.25; // Damping factor

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

// Add rect light
const rectLight = new THREE.RectAreaLight(0x0000ff, 10, 10, 10);
rectLight.position.set(5, 5, 5);
rectLight.lookAt(0, 0, 0);
rectLight.visible = false;
scene.add(rectLight);

// Rect light helper
const helper = new RectAreaLightHelper(rectLight);
rectLight.add(helper);

// Load HDR environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('./building.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  pmremGenerator.dispose();

  scene.environment = envMap;
  material.envMap = envMap;
});

// Initial material
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.09,
  envMapIntensity: 0.9 // Initial environment map intensity
});

// Function to create a box
const createBox = (x, y, z, size) => {
  const geometry = new THREE.BoxGeometry(size, size, size);
  const box = new THREE.Mesh(geometry, material);
  box.position.set(x, y, z);
  scene.add(box);
};

// Parameters for GUI
const params = {
  roughness: 0.09,
  metalness: 1.0,
  spacing: 0, // Default spacing
  envMapIntensity: 0.5 // Default environment map intensity
};

// Function to generate pattern
const generatePattern = () => {
  const step = 1 + params.spacing; // step size for x, y, and z
  const size = 0.8; // box size
  const pattern = [1, 3, 5, 7, 5, 3, 1]; // pattern array
  const startOffset = (pattern.length - 1) / 2 * step; // starting offset

  // Clear existing boxes
  while (scene.children.length > 3) {
    scene.remove(scene.children[3]);
  }

  // Generate pattern for x-y plane
  for (let yIndex = 0; yIndex < pattern.length; yIndex++) {
    const y = startOffset - yIndex * step;
    const numCubesY = pattern[yIndex];
    const startX = -(numCubesY - 1) / 2 * step;
    for (let xIndex = 0; xIndex < numCubesY; xIndex++) {
      const x = startX + xIndex * step;
      createBox(x, y, 0, size);
    }
  }

  // Generate pattern for x-z plane
  for (let zIndex = 0; zIndex < pattern.length; zIndex++) {
    const z = startOffset - zIndex * step;
    const numCubesZ = pattern[zIndex];
    const startX = -(numCubesZ - 1) / 2 * step;
    for (let xIndex = 0; xIndex < numCubesZ; xIndex++) {
      const x = startX + xIndex * step;
      createBox(x, 0, z, size);
    }
  }

  // Generate pattern for y-z plane
  for (let yIndex = 0; yIndex < pattern.length; yIndex++) {
    const y = startOffset - yIndex * step;
    const numCubesY = pattern[yIndex];
    const startZ = -(numCubesY - 1) / 2 * step;
    for (let zIndex = 0; zIndex < numCubesY; zIndex++) {
      const z = startZ + zIndex * step;
      createBox(0, y, z, size);
    }
  }
};

// Generate the pattern
generatePattern();

// lil-gui setup
const gui = new GUI();
const materialFolder = gui.addFolder('Material Properties');
materialFolder.add(material, 'roughness', 0, 1, 0.01).name('Roughness').onChange((value) => {
  material.roughness = value;
});
materialFolder.add(material, 'metalness', 0, 1, 0.01).name('Metalness').onChange((value) => {
  material.metalness = value;
});
materialFolder.add(material, 'envMapIntensity', 0, 2, 0.01).name('Env Map Intensity').onChange((value) => {
  material.envMapIntensity = value;
});
materialFolder.open();

const spacingFolder = gui.addFolder('Pattern Spacing');
spacingFolder.add(params, 'spacing', -1, 1, 0.01).name('Spacing').onChange(() => {
  generatePattern();
});
spacingFolder.open();

// Handle window resize
window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Animate
const tick = () => {
  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

