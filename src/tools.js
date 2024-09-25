// Utility functions and helper methods.

import { mapDiameter, mapRadius, camera, scene, render } from './scene.js';
import * as THREE from 'three';

const latBottomLeft = 0;
const lonBottomLeft = 0;
const latTopRight = 1;
const lonTopRight = 1;

// Function to convert integer scale to decimal scale
function convertIntegerToScale(integer) {
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
function latLonToMapCoords(lat, lon) {
    const normalizedLat = (lat - latBottomLeft) / (latTopRight - latBottomLeft);
    const normalizedLon = (lon - lonBottomLeft) / (lonTopRight - lonBottomLeft);
    const x = normalizedLon * mapDiameter - mapRadius;
    const y = normalizedLat * mapDiameter - mapRadius;
    return { x, y };
}

// Convert map coordinates to latitude and longitude
function mapCoordsToLatLon(x, y) {
    const normalizedLon = (x + mapRadius) / mapDiameter;
    const normalizedLat = (y + mapRadius) / mapDiameter;

    const lon = normalizedLon * (lonTopRight - lonBottomLeft) + lonBottomLeft;
    const lat = normalizedLat * (latTopRight - latBottomLeft) + latBottomLeft;

    return { lat, lon };
}

let points = []; // Store selected points for measurement
let line; // Line object to visualize the distance
let dot; // Dot object to visualize the distance
const dotSize = 0.5; // Size of the dots
let dots = [];
export let objectsToIntersect = []

// Create a single instance of Raycaster
export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2(); // Mouse position

// Function to check intersection with objects
export function checkIntersection(mouse) {
    // Update mouse position
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Set the raycaster from the camera
    raycaster.setFromCamera(mouse, camera);
    console.log("Objects to intersect", objectsToIntersect);
    // Check for intersections
    const intersects = raycaster.intersectObjects(objectsToIntersect, true);
    // const intersects = raycaster.intersectObjects(scene.children, true);
    // console.log("intersects", intersects);
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
    let intersects = checkIntersection(mouse);
    if (intersects) {
        let point = intersects.point;
        points.push(point); // Add the new point
        addDot(point); // Mark the point with a dot

        // If two points are selected, draw the line and measure distance
        if (points.length === 2) {
            drawLine(points);
            measureDistance(points);
        }
    }
}

// Function to measure distance between two points
function measureDistance(points) {
    if (points.length === 2) {
        const distance = points[0].distanceTo(points[1]);
        console.log(`Distance: ${distance.toFixed(2)} meters`);
    }
}

// Function to draw a line between two points
function drawLine(start, end) {
    console.log("Drawing line from:", start, "to:", end); // Log the points

    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

    const geometry = new THREE.BufferGeometry().setFromPoints( points );

    line = new THREE.Line( geometry, material );
    scene.add( line );
    render();
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

    // Clear the points array for new measurements
    points = [];
}

export { convertIntegerToScale, mapCoordsToLatLon, latLonToMapCoords };
