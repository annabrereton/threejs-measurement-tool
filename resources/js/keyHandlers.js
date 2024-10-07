import { 
    manageAKeyDown,
    manageAKeyUp,
    manageMKeyDown,
    manageMKeyUp,
 } from './measurements.js';
import { manageSKeyDown, manageSKeyUp } from './select.js';
import { manageDKeyDown, manageDKeyUp } from './dragControls.js';

// Function to handle key down events
export function onKeyDown(event) {
    if (event.key === 'm') {
        manageMKeyDown(); // Call the function to handle 'm' key down
    } else if (event.key === 'a') {
        manageAKeyDown(); // Call the function to handle 'a' key down
    } else if (event.key === 's') {
        manageSKeyDown(); // Call the function to handle 's' key down
    } else if (event.key === 'd') {
        manageDKeyDown(); // Call the function to handle 'd' key down
    }
}

// Function to handle key up events
export function onKeyUp(event) {
    if (event.key === 'm') {
        manageMKeyUp(); // Call the function to handle 'm' key up
    } else if (event.key === 'a') {
        manageAKeyUp(); // Call the function to handle 'a' key up
    } else if (event.key === 's') {
        manageSKeyUp(); // Call the function to handle 's' key up
    } else if (event.key === 'd') {
        manageDKeyUp(); // Call the function to handle 'd' key up
    }
}