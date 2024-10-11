import { onKeyDown, onKeyUp } from './keyHandlers.js';
import { onMouseMove, onMouseClick } from './mouseHandlers.js';
import { selectedObject } from './select.js';
import { loadPanel1, loadPanel2 } from './panels.js'; // Import panel loading functions
import { scene, handleResize, objectsToIntersect } from './scene.js';
import { deleteMeasurement, editMeasurement } from './measurements.js';


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
    document.addEventListener('contextmenu', function(event) {
        event.preventDefault(); // Prevent the default context menu
        console.log("Context menu event listener");
        console.log(selectedObject);
        if (selectedObject) {
            showContextMenu(event, selectedObject);
        }
    });

    // Hide the context menu when clicking elsewhere
    document.addEventListener('click', function() {
        hideContextMenu();
    });

    function showContextMenu(event, object) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = `${event.pageX}px`;
        contextMenu.style.top = `${event.pageY}px`;

        // Clear existing menu items
        contextMenu.innerHTML = '';

        // Add menu items based on the object type
        if (object.userData.type === 'measurementGroup') {
            addMenuItem(contextMenu, 'Edit', () => editMeasurement(object));
            addMenuItem(contextMenu, 'Delete', () => deleteMeasurement(object));
        }
        // Add more object types here as needed
        // else if (object.userData.type === 'someOtherType') {
        //     addMenuItem(contextMenu, 'Some Action', () => someAction(object));
        // }
    }

    function hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'none';
    }

    function addMenuItem(menu, text, onClick) {
        const item = document.createElement('div');
        item.textContent = text;
        item.classList.add('context-menu-item');
        item.style.padding = '10px';
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            onClick();
            hideContextMenu();
        });
        menu.appendChild(item);
    }
}