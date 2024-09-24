// Load tree model

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; 
import {mapHeight, scene} from './scene.js';

export function loadTreeModel() {
    const treeLoader = new GLTFLoader();
    treeLoader.load('assets/tree.glb', function (gltf) {
        const tree = gltf.scene;
        tree.name = "tree";
        tree.userData.type = "tree";
        tree.position.set(-10, mapHeight / 2, 60);   

        const scaleFactor = 12; 
        tree.scale.set(scaleFactor, scaleFactor, scaleFactor); 

        tree.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true; // Enable shadow casting for the mesh
                child.receiveShadow = true; // Enable shadow receiving for the mesh
            }
        });
    
        scene.add(tree);
        console.log("tree", tree);
    }, undefined, function (error) {
        console.error('An error occurred while loading the GLTF model:', error);
    });
}