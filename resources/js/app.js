import './bootstrap';
import '../css/app.css';
import {
    scene, 
    setupScene, 
    setupMapMesh, 
    addLights, 
    setupOrbitControls, 
    animate, 
    handleResize
} from './scene.js';
import { fetchAndDisplaySavedMeasurements } from './measurements.js';
import { createAndRenderHouse } from './house.js';
import { loadTreeModel } from './tree.js';
import { setupEventListeners } from './eventListeners.js';

// Initialize application
async function init() {
    setupScene();
    setupMapMesh();
    addLights();
    setupOrbitControls();
    createAndRenderHouse(scene, {
        wallColour: 0xffffff,
        roofColour: 0x0d6efd,
        doorColour: 0xff0000,
        windowColour: 0x537d90,
        position: { x: 0, y: 0, z: 0 },
        doorStyle: 'fancy',
        windowStyle: 'rectangular',
        scale: 11
    });
    loadTreeModel();
    animate();
    setupEventListeners();
    fetchAndDisplaySavedMeasurements()
}

init();
