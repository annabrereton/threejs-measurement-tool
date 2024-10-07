import { checkIntersection } from './scene.js';

export let selectedObject = null;
export let enableSelect = false;
let objectType = null;

export function manageSKeyDown(event) {
    enableSelect = true; // Enable selection mode
}

export function manageSKeyUp() {
    enableSelect = false; // Disable selection mode
}

export function handleSelectClick(event) {
    selectObject(event);
}

function getObjectType(intersect) {
    if (intersect) {
        console.log("Type:", intersect.object.userData.type);
        return intersect.object.userData.type; // Return the user data type
    }
    return null; // Return null if no intersection
}

export function selectObject(event) {
    const intersect = checkIntersection(event); // Get the intersected object
    objectType = getObjectType(intersect); // Get the object type

    if (intersect) {
        let targetObject = intersect.object;

        // Log the selected object
        console.log("Selected object:", selectedObject);
        console.log("Target object:", targetObject);
        console.log("User data type:", objectType); // Debugging output

        // Check if the clicked object is the same as the currently selected object
        if (selectedObject === targetObject || selectedObject === targetObject.parent) {
            console.log("Deselecting object:", targetObject.name);
            deselectObject(selectedObject); // Deselect the object
            selectedObject = null; // Clear the selected object
            return; // Exit early
        }
        
        // Deselect the previous object if it's different from the target
        if (selectedObject && selectedObject !== targetObject) {
            console.log("Deselecting previous object:", selectedObject.name);
            deselectObject(selectedObject); // Deselect the previous object
        }

        console.log("Object selected:", targetObject.name);

        // Check if the intersected object is a dot or line
        if (objectType === 'dot' || objectType === 'measurementLine') {
            console.log("Part of measurement selected:", targetObject.name);
            // Highlight the group if the target object is part of a group
            const measurementGroup = targetObject.parent; // Assuming the parent is the group
            if (measurementGroup && measurementGroup.isGroup) {
                highlightObject(measurementGroup); // Highlight the entire group
            } else {
                highlightObject(targetObject); // Highlight the individual object
            }
            selectedObject = targetObject; // Set the selected object
            return; // Exit early
        }
        
        // Check if the intersected object is a tree
        if (objectType === 'treePart') {
            console.log("Tree part selected:", targetObject.name);
            targetObject = targetObject.parent;
            console.log("Tree selected:", targetObject.name);
            highlightObject(targetObject); // Highlight the tree
            selectedObject = targetObject; // Set the selected object
            console.log("Selected object set:", selectedObject);
            return; // Exit early
        } else {
            highlightObject(targetObject); // Highlight the dot
            selectedObject = targetObject; // Set the selected object
            console.log("Selected object set:", selectedObject);
            return; // Exit early
        }
    }
}

// Highlight the selected object (panel, line, or dot)
export function highlightObject(object) {
    console.log("Highlighting object:", object.name);

    // Check if the object is a dot or map mesh
    if (object.userData.type === 'meas' || object.userData.type === 'mapMesh') {
        // Change the emissive color to create a highlight effect
        if (object.material.isMeshStandardMaterial || object.material.isMeshBasicMaterial) {
            object.material.emissive.setHex(0xffff00); // Yellow emissive glow
            object.material.emissiveIntensity = 0.6;  // Set intensity
            object.material.needsUpdate = true;  // Ensure the material is updated
        } else {
            // Fallback for other material types
            object.material.color.setHex(0xffff00); // Change color to yellow
            object.material.needsUpdate = true; // Ensure the material is updated
        }
    } else {
        // Traverse the object to apply the highlight to all child meshes
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.isMeshStandardMaterial || child.material.isMeshPhongMaterial) {
                    child.material.emissive.setHex(0xffff00); // Yellow emissive glow
                    child.material.emissiveIntensity = 0.6;  // Set intensity
                    child.material.needsUpdate = true;  // Ensure the material is updated
                }
            }
        });
    }
}

// Unhighlight the selected object (panel, line, or dot)
export function unhighlightObject(object) {
    console.log("Unhighlighting object:", object.name);

    // Check if the object is a dot or map mesh
    if (object.userData.type === 'dot' || object.userData.type === 'mapMesh') {
        if (object.material.isMeshStandardMaterial) {
            object.material.emissive.setHex(0x000000); // Reset emissive color
            object.material.emissiveIntensity = 0;    // Reset intensity
            object.material.needsUpdate = true; // Ensure the material is updated
        } else {
            // Fallback for other material types
            object.material.color.setHex(object.userData.originalColor); // Reset to original color
            object.material.needsUpdate = true; // Ensure the material is updated
        }
    } else {
        // Traverse the object to reset the highlight for all child meshes
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.isMeshStandardMaterial || child.material.isMeshPhongMaterial) {
                    child.material.emissive.setHex(0x000000); // Reset emissive color
                    child.material.emissiveIntensity = 0;    // Reset intensity
                }
            }
        });
    }
}


// Remove highlight from the object (panel)
export function deselectObject(object) {
    // Check if the object is part of a group
    if (object.parent && object.parent.isGroup) {
        const measurementGroup = object.parent; // Get the parent group

        // Unhighlight the entire group
        unhighlightObject(measurementGroup);

        // Optionally, you can also loop through the children to ensure they are unhighlighted
        measurementGroup.children.forEach(child => {
            unhighlightObject(child);
        });
    } else {
        // If it's not part of a group, just unhighlight the individual object
        unhighlightObject(object);
    }
}
