import * as THREE from 'three';
import {
    CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer'
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import { objectsToIntersect } from './tools.js';

// Global variables
export let scene, camera, renderer, orbitControls, mapMesh;

// Map data
export const mapDiameter = 300;        // Diameter in meters
export const mapHeight = 10;           // Height of the cylinder
export const mapRadius = mapDiameter / 2;

// Basic scene setup
export function setupScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Set up camera position
    camera.position.set(10, 20, 200);  // x, y, z
    camera.lookAt(0, 0, 0);  // Make the camera look at the center of the map
}

export function setupMapMesh() {
    // Create a cylinder geometry for the map
    const mapGeometry = new THREE.CylinderGeometry(mapRadius, mapRadius, mapHeight, 64);
    const mapMaterial = new THREE.MeshStandardMaterial({color: 0x00ff00, side: THREE.DoubleSide});
    mapMesh = new THREE.Mesh(mapGeometry, mapMaterial);
    mapMesh.receiveShadow = true;
    mapMesh.name = 'mapMesh';
    mapMesh.userData.type = 'mapMesh';
    scene.add(mapMesh);
    objectsToIntersect.push(mapMesh);

    // GRID HELPER
    let grid = new THREE.GridHelper(300, 10, "aqua", "gray");
    grid.rotation.y = Math.PI / 2;
    grid.position.z = 5.2
    scene.add(grid);
}

// Add lighting to the scene
export function addLights() {
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(100, 200, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    scene.add(directionalLight);
    scene.add(directionalLight.target);
}

// Setup Orbit Controls
export function setupOrbitControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    console.log("orbitControls set up.");
}

export const labelRenderer = new CSS2DRenderer()
labelRenderer.setSize(window.innerWidth, window.innerHeight)
labelRenderer.domElement.style.position = 'absolute'
labelRenderer.domElement.style.top = '0px'
labelRenderer.domElement.style.pointerEvents = 'none'
document.body.appendChild(labelRenderer.domElement)

// Handle window resize
export function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
export function animate() {
    requestAnimationFrame(animate);

    orbitControls.update();
 
    render();
}

export function render() {
    labelRenderer.render(scene, camera)
    renderer.render( scene, camera );
}