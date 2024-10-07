import { gltfLoader } from './loaders.js';

export function loadPanel1() {
    return new Promise((resolve) => {
        gltfLoader.load('assets/panel1.gltf', function (gltf) {
            const panel1 = gltf.scene.clone(); // Clone the panel (this is good)
            panel1.name = "panel1"; // Name it uniquely
            panel1.userData.type = "panel"; // Identify it as a panel type
            panel1.position.set(85, 6, 0); // Initial position
            resolve(panel1); // Resolve with the cloned panel
        });
    });
}

export function loadPanel2() {
    return new Promise((resolve) => {
        gltfLoader.load('assets/panel2.gltf', function (gltf) {
            const panel2 = gltf.scene.clone(); // Clone the panel
            panel2.name = "panel2"; // Name it uniquely
            panel2.userData.type = "panel"; // Identify it as a panel type
            panel2.position.set(60, 6, 0); // Initial position
            resolve(panel2); // Resolve with the cloned panel
        });
    });
}
