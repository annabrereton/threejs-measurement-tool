import { scene, checkIntersection } from './scene.js';
import { addLabel, hasActiveMeasurement } from './measurements.js';

export let selectedObject = null;
export let enableSelect = false;
let objectType = null;

export function manageSKeyDown(event) {
    if (!hasActiveMeasurement) {    
        enableSelect = true; // Enable selection mode
    }
}

export function manageSKeyUp() {
    enableSelect = false; // Disable selection mode
}

export function handleSelectClick(event) {
    selectObject(event);
}

function getObjectType(object) {
    if (object && object.userData) {
        if (object.userData.type === 'measurementLine' || object.userData.type === 'dot') {
            // Return the parent's type, which should be 'measurementGroup'
            return object.parent.userData.type;
        }
        return object.userData.type;
    }
    return null;
}

export function selectObject(event) {
    const intersect = checkIntersection(event);
    if (!intersect) return;

    let targetObject = intersect.object;
    console.log("Target object:", targetObject);
    const objectType = getObjectType(targetObject);
    
    console.log("Object type:", objectType);

    if (objectType === 'measurementGroup' || objectType === 'treePart') {
        console.log("Measurement group selected:", targetObject);
        targetObject = targetObject.parent;
        console.log("Group selected:", targetObject);
    }

    if (selectedObject === targetObject) {
        console.log("Deselecting object:", selectedObject.name);
        deselectObject(selectedObject);
        selectedObject = null;
    } else {
        if (selectedObject) {
            console.log("Deselecting previous object:", selectedObject.name);
            deselectObject(selectedObject);
        }
        highlightObject(targetObject);
        console.log("Highlighting object:", targetObject.name);
        selectedObject = targetObject;

        if (objectType === 'measurementGroup') {
            addLabel(targetObject);
        }
    }

    console.log("Selected object:", selectedObject);
}


function applyMaterialEffect(material, isHighlight) {
    const color = isHighlight ? 0xffff00 : 0x000000; // Yellow for highlight, black for unhighlight
    const intensity = isHighlight ? 0.6 : 0;

    if (material.isMeshStandardMaterial || material.isMeshPhongMaterial) {
        material.emissive.setHex(color);
        material.emissiveIntensity = intensity;
    } else {
        // Fallback for other material types
        material.color.setHex(isHighlight ? color : material.userData.originalColor || color);
    }
    material.needsUpdate = true;
}

function applyEffectToObjectOrChildren(object, isHighlight) {
    if (object.isMesh && object.material) {
        applyMaterialEffect(object.material, isHighlight);
    } else if (object.isGroup || object.isObject3D) {
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                applyMaterialEffect(child.material, isHighlight);
            }
        });
    }
}

export function highlightObject(object) {
    console.log("Highlighting object:", object.name);
    applyEffectToObjectOrChildren(object, true);
}

export function unhighlightObject(object) {
    console.log("Unhighlighting object:", object.name);
    applyEffectToObjectOrChildren(object, false);
}

// Remove highlight from the object (panel)
export function deselectObject(object) {
    // Check if the object is part of a group
    if (object.userData.type === 'measurementGroup') {
        const measurementGroup = object; 
        // Unhighlight the entire group
        unhighlightObject(measurementGroup);
        // Hide all measurement labels
        measurementGroup.children.forEach(child => {
            if (child.userData.type === 'measurementLine') {
                console.log("Deselecting measurement line:", child);
                child.children.forEach(grandChild => {
                    if (grandChild.isCSS2DObject) {
                        console.log("Hiding label:", grandChild);
                        grandChild.visible = false; // Hide the label
                    }
                });
            }
        });

    } else {
        // If it's not part of a group, just unhighlight the individual object
        unhighlightObject(object);
    }
}
