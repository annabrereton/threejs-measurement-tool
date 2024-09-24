import './styles.css';
import {
    scene, 
    setupScene, 
    setupMapMesh, 
    addLights, 
    setupOrbitControls, 
    animate, 
    handleResize
} from './scene.js';
import { createAndRenderHouse } from './house.js';
import { loadTreeModel } from './tree.js'

// Initialize application
function init() {
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
    loadTreeModel()
    animate();
    window.addEventListener('resize', handleResize);
}

init();
