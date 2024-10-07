import * as THREE from 'three';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { camera, renderer, orbitControls, render, labelRenderer, checkIntersection } from './scene.js';
import { selectedObject } from './select.js';

export let dragControls;

export function manageDKeyDown() {
    // console.log('D key down');
    if (dragControls) {
        return;
    }
    if (selectedObject) {
        // console.log("Enabling dragging", selectedObject);
        setupDragControls(selectedObject, false);
    }
}

export function manageDKeyUp() {
    // console.log('D key up');
    if (dragControls) {
        // console.log("Disposing drag controls");
        disposeDragControls();
    }
}

export function setupDragControls(objectsToDrag, isRotating = false) {
    console.log('Setting up drag controls', objectsToDrag, isRotating);
    if (dragControls) {
        dragControls.dispose();
    }

    dragControls = new DragControls([objectsToDrag], camera, renderer.domElement);

    dragControls.addEventListener('dragstart', function (event) {
        labelRenderer.domElement.style.display = 'none';  // Hide label renderer
        orbitControls.enabled = false;
    });

    dragControls.addEventListener('drag', function (event) {
          // Perform raycasting during dragging
          const intersect = checkIntersection(event);

          if (intersect) {
              // Snap object to the intersection point
              event.object.position.copy(intersect.point);
  
              // Align the object's rotation to the surface normal
              const normal = intersect.face.normal.clone();
              const up = new THREE.Vector3(0, 1, 0); // Default up-vector
              const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
              event.object.quaternion.copy(quaternion); // Align rotation
          }
          
          // If rotating is enabled, apply rotation logic
          if (isRotating) {
              event.object.rotation.y += 0.1;
              console.log("Rotating object", event.object.rotation.y);
          }
  
          render(); // Re-render the scene to reflect changes
    });

    dragControls.addEventListener('dragend', function (event) {
        labelRenderer.domElement.style.display = 'block';  // Show label renderer
        orbitControls.enabled = true;
        console.log('Drag ended on:', event.object.name);

        // Perform a final snap to the nearest surface
        const intersect = checkIntersection(event);

        if (intersect) {
            // Snap object to the intersection point
            event.object.position.copy(intersect.point);

            // Align the object's rotation to the surface normal
            const normal = intersect.face.normal.clone();
            const up = new THREE.Vector3(0, 1, 0); // Default up-vector
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
            event.object.quaternion.copy(quaternion); // Align rotation
        }

        render(); // Re-render the scene
    });
    
    dragControls.enabled = true;
}

export function disposeDragControls() {
    if (dragControls) {
        dragControls.dispose();
        dragControls = null;
        console.log('Drag controls disposed');
    }
}