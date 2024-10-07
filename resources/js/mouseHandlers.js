import { mouse } from './scene.js';
import { handleMeasurementClick } from './measurements.js';
import { handleSelectClick, enableSelect } from './select.js';

// Update mouse position
export function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

export function onMouseClick(event) {
    handleMeasurementClick(event);
    if (enableSelect) {
        handleSelectClick(event);
    }
}