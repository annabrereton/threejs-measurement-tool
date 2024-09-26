import { camera, scene,  orbitControls, renderer } from './scene.js';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'

let points = []; // Store selected points for measurement
let areaPoints = []; // Store selected points for area measurement
let line; // Line object to visualize the distance
let polygon; // Polygon object to visualize the area
let dot; // Dot object to visualize the distance
const dotSize = 0.5; // Size of the dots
let dots = [];
export let objectsToIntersect = []
let measurement = 0;
let measurementLabel;
let enableMeasurement = false;
let enableAreaMeasurement = false;
let isMeasuring = false;
let hasActiveMeasurement = false;
let hasAreaMeasurement = false;
export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2(); // Mouse position


// Function to handle key down events
export function onKeyDown(event) {
    if (hasActiveMeasurement) return; // Prevent new measurement if an active one exists

    if (event.key === 'm') {
        enableMeasurement = true;
        orbitControls.enabled = false;
        renderer.domElement.style.cursor = 'crosshair';
    } else if (event.key === 'a') {
        enableAreaMeasurement = true; // Enable point selection
        orbitControls.enabled = false;
        renderer.domElement.style.cursor = 'crosshair';
    }
}

// Function to handle key up events
export function onKeyUp(event) {
    if (event.key === 'm') {
        enableMeasurement = false;
        orbitControls.enabled = true;
        renderer.domElement.style.cursor = 'pointer';
        if (isMeasuring) {
            scene.remove(line); // Remove the last line because it wasn't committed
            isMeasuring = false;
        }
    } else if (event.key === 'a') {
        enableAreaMeasurement = false;
        orbitControls.enabled = true;
        renderer.domElement.style.cursor = 'pointer';
        if (areaPoints.length < 3) { 
            clearMeasurement();  // Clear if measurement not completed
        } else if (areaPoints.length >= 3 && !hasAreaMeasurement) {
            const area = calculateArea(areaPoints);
            console.log(`Area: ${area.toFixed(2)} square metres`);
            drawPolygon(areaPoints); // Draw the polygon based on selected area points
            populateAreaMeasurementContainer(area); // Display area details in the sidebar
        }
    }
}

export function onMouseMove(event) {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

export function onMouseClick(event) {
    if (enableMeasurement || enableAreaMeasurement) {
        addPoint(event);
    }
}

// Function to check intersection with objects
export function checkIntersection(event) {
    onMouseMove(event); // Update mouse position
    raycaster.setFromCamera(mouse, camera); // Set the raycaster from the camera
    const intersects = raycaster.intersectObjects(objectsToIntersect, true);
    return intersects.length > 0 ? intersects[0] : null; // Return the first intersection or null
}

// Function to add a point to points array and mark with a dot
export function addPoint(event) { 
    // Check for intersection with objects
    let intersects = checkIntersection(event);
    if (intersects) {
        const point = intersects.point; // Get the intersection point

        // If measurement mode is enabled
        if (enableMeasurement) {      
            points.push(point); // Add the point to the measurement array
            addDot(point); // Mark the point with a dot
            isMeasuring = true;

            // If two points are selected, draw the line and measure distance
            if (points.length === 2) {
                isMeasuring = false;
                drawLine(points);
                addLabel(points);
                populateMeasurementContainer(points);
                hasActiveMeasurement = true;
            }
        } else if (enableAreaMeasurement) { // If 'a' key is pressed, handle area calculation        
            areaPoints.push(point); // Add to area points
            addDot(point); // Mark the point with a dot

            if (areaPoints.length >= 3) {
                hasActiveMeasurement = true; // Prevent further measurements until cleared
            }
        }
    }
}

// Function to add a dot at a given point
function addDot(position) {
    const geometry = new THREE.SphereGeometry(dotSize, 16, 16); // Create a sphere
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
    dot = new THREE.Mesh(geometry, material);
    dot.position.copy(position); // Set the position of the dot
    scene.add(dot); // Add the dot to the scene
    dots.push(dot)
}

// Function to draw a line between two points
function drawLine(start, end) {
    console.log("Drawing line from:", start, "to:", end); // Log the points

    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

    const geometry = new THREE.BufferGeometry().setFromPoints( points );

    line = new THREE.Line( geometry, material );
    scene.add(line);
}

// Function to draw a polygon around the selected points
function drawPolygon(areaPoints) {
    // Convert Vector3 points to Vector2 to create a polygon
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const geometry = new THREE.BufferGeometry().setFromPoints(areaPoints);
    polygon = new THREE.LineLoop(geometry, material);
    scene.add(polygon);
}

function calculateArea(points) {
    let area = 0;
    const n = points.length;

    // Calculate the area using the 2D projection (ignoring y-axis, using x and z)
    for (let i = 0; i < n; i++) {
        const currentPoint = points[i];
        const nextPoint = points[(i + 1) % n]; // Wrap around to the first point
        
        // Use only the x and y coordinates for area calculation
        area += currentPoint.x * nextPoint.z;
        area -= nextPoint.x * currentPoint.z;
    }

    area = Math.abs(area) / 2; // Absolute value and divide by 2 to get the final area
    console.log("area", area);
    return area;
}

// Function to display area details in the sidebar
function populateAreaMeasurementContainer(area) {
    const innerHTML = `<p class="mb-1">Area: ${area.toFixed(2)} square metres</p>`;

    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('d-none');

    const measurementContainer = document.createElement('div');
    measurementContainer.className = 'measurementText';
    measurementContainer.style.backgroundColor = '#fff';
    measurementContainer.style.padding = '5px';
    measurementContainer.style.fontFamily = 'Arial, sans-serif';
    measurementContainer.innerHTML = innerHTML;

    sidebar.appendChild(measurementContainer);

    const clearMeasurementButton = document.createElement('a');
    clearMeasurementButton.href = '#';
    clearMeasurementButton.id = 'clearMeasurement';
    clearMeasurementButton.className = 'btn btn-sm btn-primary align-self-end';
    clearMeasurementButton.innerText = 'Clear';
    clearMeasurementButton.addEventListener('click', (event) => {
        event.preventDefault(); 
        clearMeasurement(); // Call the clear function to reset everything
    });
    sidebar.appendChild(clearMeasurementButton);
    hasAreaMeasurement = true;
}

function populateMeasurementContainer(points) {
    const measurement = measureDistance(points);
    const innerHTML = `
    <p class="mb-1">Point 1: x: ${(points[0].x).toFixed(2)}, y: ${(points[0].y).toFixed(2)}, z: ${(points[0].z).toFixed(2)}</p>
    <p class="mb-1">Point 2: x: ${(points[1].x).toFixed(2)}, y: ${(points[1].y).toFixed(2)}, z: ${(points[1].z).toFixed(2)}</p>
    <p class="mb-1">Distance: ${measurement} metres</p>`;
    
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('d-none');
    
    // Create a new div element
    const measurementContainer = document.createElement('div');
    measurementContainer.className = 'measurementText'
    measurementContainer.style.backgroundColor = '#fff';
    measurementContainer.style.padding = '5px';
    measurementContainer.style.fontFamily = 'Arial, sans-serif';
    measurementContainer.innerHTML = innerHTML; // Set the inner HTML

    sidebar.appendChild(measurementContainer); // Append the new div to the container
    const clearMeasurementButton = document.createElement('a');
    clearMeasurementButton.href = '#';
    clearMeasurementButton.id = 'clearMeasurement';
    clearMeasurementButton.className = 'btn btn-sm btn-primary align-self-end';
    clearMeasurementButton.innerText = 'Clear';
    clearMeasurementButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        clearMeasurement(); // Call the clearMeasurement function
    });
    sidebar.appendChild(clearMeasurementButton);
}

function addLabel(points) {
    const innerText = measureDistance(points);
    console.log("innerText", innerText);

    const measurementDiv = document.createElement('div');
    measurementDiv.className = 'measurementLabel'
    measurementDiv.style.backgroundColor = '#fff';
    measurementDiv.style.border = '1px solid #ccc';
    measurementDiv.style.borderRadius = '5px';
    measurementDiv.style.padding = '5px';
    measurementDiv.style.fontFamily = 'Arial, sans-serif';
    measurementDiv.pointerEvents = 'auto',
    measurementDiv.innerText = innerText;
    // measurementDiv.innerText = `${measurement.toFixed(2)}m`;

    // Calculate the midpoint of the line
    const midPoint = new THREE.Vector3().addVectors(points[0], points[1]).multiplyScalar(0.5);

    const offsetY = 1; // Adjust this value to move the label higher or lower
    measurementLabel = new CSS2DObject(measurementDiv);
    measurementLabel.position.set(midPoint.x, midPoint.y + offsetY, midPoint.z); // Adjust y position
    scene.add(measurementLabel);
}

// Function to measure distance between two points
function measureDistance(points) {
    if (points.length === 2) {
        console.log(`Measurement: ${measurement.toFixed(2)} meters`);
        measurement = points[0].distanceTo(points[1]);
        return measurement.toFixed(2);
    }
}

// // Function to clear all measurements
function clearMeasurement() {
    console.log("Clearing measurement", points, areaPoints, line, polygon, measurementLabel, dots, measurement);
    points = [];
    areaPoints = [];
    if (line) scene.remove(line);
    if (polygon) scene.remove(polygon);
    if (measurementLabel) scene.remove(measurementLabel);
    dots.forEach(dot => scene.remove(dot));
    dots = [];
    measurement = 0;
    hasActiveMeasurement = false;
    hasAreaMeasurement = false;
    isMeasuring = false;
    enableMeasurement = false;
    enableAreaMeasurement = false;

    // Clear sidebar
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = ''; // Clear all measurement details
    sidebar.classList.add('d-none');
}
