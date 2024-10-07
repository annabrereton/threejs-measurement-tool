import { onKeyDown, onKeyUp } from './keyHandlers.js';
import { onMouseMove, onMouseClick } from './mouseHandlers.js';
import { handleResize } from './scene.js';
import { loadPanel1, loadPanel2 } from './panels.js'; // Import panel loading functions
import { scene, checkIntersection, objectsToIntersect } from './scene.js'; // Combined import

export function setupEventListeners() {
    // console.log("Setting up event listeners");
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Button event listeners
    document.getElementById('addPanel1').addEventListener('click', async () => {
        const panel1 = await loadPanel1(); // Load and clone panel 1 each time button is clicked
        scene.add(panel1); // Add to scene
        objectsToIntersect.push(panel1); // Add to intersect array
    });

    document.getElementById('addPanel2').addEventListener('click', async () => {
        const panel2 = await loadPanel2(); // Load and clone panel 2 each time button is clicked
        scene.add(panel2); // Add to scene
        objectsToIntersect.push(panel2); // Add to intersect array
    });

    // Toggle save measurements sidebar event listener
    document.addEventListener('DOMContentLoaded', () => {
        const toggleButton = document.getElementById('toggleSidebar');
        const savedMeasurementsContent = document.getElementById('savedMeasurementsContent');

        toggleButton.addEventListener('click', () => {
            const isHidden = savedMeasurementsContent.style.display === 'none';
            savedMeasurementsContent.style.display = isHidden ? 'block' : 'none';
            toggleButton.innerText = isHidden ? '-' : '+';

            // Explicitly set display for each measurementText element
            const measurementTexts = savedMeasurementsContent.getElementsByClassName('measurementText');
            for (let i = 0; i < measurementTexts.length; i++) {
                measurementTexts[i].style.display = isHidden ? 'block' : 'none';
            }
        });
    });

    // Context Menu Event Listener
    document.addEventListener('contextmenu', function(event, selectedObject) {
    event.preventDefault(); // Prevent the default context menu

    const intersect = checkIntersection(event); // Check if a measurement is clicked
        if (intersect) {
            const targetObject = intersect.object;

            // Check if the target object is part of a measurement group
            if (targetObject.userData.type === 'measurementLine' || targetObject.userData.type === 'dot') {
                const measurementGroup = targetObject.parent; // Get the parent group
                console.log("measurementGroup.userData", measurementGroup.userData);
                // Show the context menu at the mouse position
                const contextMenu = document.getElementById('contextMenu');
                contextMenu.style.display = 'block';
                contextMenu.style.left = `${event.pageX}px`;
                contextMenu.style.top = `${event.pageY}px`;

                // Store the measurement group for deletion
                contextMenu.dataset.measurementId = measurementGroup.userData.measurementId;
            }
        }
    });

    // Hide the context menu when clicking elsewhere
    document.addEventListener('click', function() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
    });

    document.getElementById('deleteMeasurement').addEventListener('click', function() {
        const contextMenu = document.getElementById('contextMenu');
        const measurementId = contextMenu.dataset.measurementId; // Get the measurement ID
    
        if (measurementId) {
            // Send a request to delete the measurement from the database
            axios.delete(`/api/measurements/${measurementId}`)
                .then(response => {
                    console.log('Measurement deleted:', response.data);
    
                    // Find the measurement group by userData.measurementId
                    const measurementGroup = scene.children.find(child => 
                        child.userData.measurementId == measurementId // Match the measurement ID
                    );
                    // Remove the group from the scene
                    if (measurementGroup) {
                        scene.remove(measurementGroup); // Remove the group from the scene
                        console.log("Measurement group removed from scene:", measurementGroup);
                    } else {
                        console.warn("Measurement group not found in scene for ID:", measurementId);
                    }
                     // Remove the corresponding measurement container from the sidebar
                    const measurementContainer = document.querySelector(`.measurementText[data-measurement-id="${measurementId}"]`);
                    if (measurementContainer) {
                        measurementContainer.remove(); // Remove the container from the sidebar
                        console.log("Measurement container removed from sidebar:", measurementContainer);
                    } else {
                        console.warn("Measurement container not found in sidebar for ID:", measurementId);
                    }
                })
                .catch(error => {
                    console.error('Error deleting measurement:', error);
                });
        }
    
        // Hide the context menu
        contextMenu.style.display = 'none';
    });
}