import { mapDiameter, mapRadius, camera, scene, render, orbitControls, renderer, labelRenderer } from './scene.js';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'

let points = []; // Store selected points for measurement
let line; // Line object to visualize the distance
let dot; // Dot object to visualize the distance
const dotSize = 0.5; // Size of the dots
let dots = [];
export let objectsToIntersect = []
let measurement = 0;
let measurementLabel;
let enableMeasurement = false;
let isMeasuring = false;

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2(); // Mouse position

const latBottomLeft = 0;
const lonBottomLeft = 0;
const latTopRight = 1;
const lonTopRight = 1;

// Function to convert integer scale to decimal scale
export function convertIntegerToScale(integer) {
    const mapping = {
        1: 0.2,
        2: 0.4,
        3: 0.5,
        4: 0.6,
        5: 0.7,
        6: 0.8,
        7: 0.9,
        8: 1.0
    };

    return mapping[integer] || 0.9; // Default scale if not found
}

// Convert latitude and longitude to map coordinates
export function latLonToMapCoords(lat, lon) {
    const normalizedLat = (lat - latBottomLeft) / (latTopRight - latBottomLeft);
    const normalizedLon = (lon - lonBottomLeft) / (lonTopRight - lonBottomLeft);
    const x = normalizedLon * mapDiameter - mapRadius;
    const y = normalizedLat * mapDiameter - mapRadius;
    return { x, y };
}

// Convert map coordinates to latitude and longitude
export function mapCoordsToLatLon(x, y) {
    const normalizedLon = (x + mapRadius) / mapDiameter;
    const normalizedLat = (y + mapRadius) / mapDiameter;

    const lon = normalizedLon * (lonTopRight - lonBottomLeft) + lonBottomLeft;
    const lat = normalizedLat * (latTopRight - latBottomLeft) + latBottomLeft;

    return { lat, lon };
}

// Function to handle key down events
export function onKeyDown (event) {
    console.log("onKeyDown", event);
    if (event.key === 'm') {
        console.log("m key pressed");


        enableMeasurement = true
        orbitControls.enabled = false
        renderer.domElement.style.cursor = 'crosshair'
    }
}

// Function to handle key up events
export function onKeyUp (event) {
    console.log("onKeyUp", event);
    if (event.key === 'm') {
        enableMeasurement = false
        orbitControls.enabled = true
        renderer.domElement.style.cursor = 'pointer'
        if (isMeasuring) {
            //delete the last line because it wasn't committed
            scene.remove(line)
            // scene.remove(measurementLabels[lineId])
            isMeasuring = false
        }
    }
}

export function onMouseMove(event) {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

export function onMouseClick(event) {
    if (enableMeasurement) {
        addPoint(event);
    }
}

// Function to check intersection with objects
export function checkIntersection(event) {
    // Update mouse position
    onMouseMove(event);

    // Set the raycaster from the camera
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections
    const intersects = raycaster.intersectObjects(objectsToIntersect, true);

    return intersects.length > 0 ? intersects[0] : null; // Return the first intersection or null
}

// Function to add a point to points array and mark with a dot
export function addPoint(event) { 
    // Clear existing measurement if there are already two points
    if (points.length === 2) {
        console.log("clearing:", line, dots)
        clearMeasurement(); // Clear the previous line and dots
    }

    // Check for intersection with objects
    let intersects = checkIntersection(event);
    if (intersects) {
        let point = intersects.point;
        points.push(point); // Add the new point
        addDot(point); // Mark the point with a dot
        isMeasuring = true

        // If two points are selected, draw the line and measure distance
        if (points.length === 2) {
            isMeasuring = false

            drawLine(points);
            scene.add( line );

            addLabel(points);
            scene.add(measurementLabel);
        
            populateMeasurementContainer(points);
            
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

    return line = new THREE.Line( geometry, material );
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

    return measurementLabel;
}

// Function to measure distance between two points
function measureDistance(points) {
    if (points.length === 2) {
        console.log(`Measurement: ${measurement.toFixed(2)} meters`);
        measurement = points[0].distanceTo(points[1]);
        return measurement.toFixed(2);
    }
}

// Function to clear points, distance, line, and dots
export function clearMeasurement() {
    // Clear all dots from the scene
    if (dots.length > 0) {
        dots.forEach(dot => {
            scene.remove(dot); // Remove each dot from the scene
        });
        dots = []; // Reset the dots array
    }
    console.log("Line", line);
    // Clear the line from the scene if it exists
    if (line) {
        scene.remove(line); // Remove the line from the scene
        line = null; // Reset the line variable
    }
    // Clear the measurement & label from the scene if it exists
    measurement = 0;
    if (measurementLabel) {
        scene.remove(measurementLabel);
        measurementLabel = null;
    }

    // Clear the points array for new measurements
    points = [];

    // Clear the measurementContainer
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = ''; // Clear the contents
    sidebar.classList.add('d-none'); // Hide the sidebar
}

