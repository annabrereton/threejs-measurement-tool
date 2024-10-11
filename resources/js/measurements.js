import { scene,  orbitControls, renderer, checkIntersection, objectsToIntersect } from './scene.js';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { openSaveModal, removeBackdrop } from './modals.js';
import { selectedObject } from './select.js';
import { openEditMeasurementModal } from './modals.js';
import { updateMeasurementRequest, deleteMeasurementRequest } from './axios.js';
import { showMessage } from './alerts.js';

let areaPoints = []; // Store selected points for area measurement
let polygon; // Polygon object to visualize the area
const dotSize = 0.5; // Size of the dots
let areaDots = [];
let measurementLabel;
let enableMeasurement = false;
let enableAreaMeasurement = false;
export let hasActiveMeasurement = false;
export let currentMeasurement = { 
    points: [], 
    distances: [], 
    totalDistance: 0, 
    dots: [], 
    lines: [],
    lastPoint: null,
    lastDot: null,
    lastLine: null,
    lastDistance: 0
}; // Object to store the current measurement data
let hasAreaMeasurement = false;
let measurementIndex = 0; // Initialize a counter outside the function
let measurementContainer;


export function manageMKeyDown() {
    if (selectedObject) {
        enableMeasurement = false; 
        return;
    }
    enableMeasurement = true;
    orbitControls.enabled = false;
    renderer.domElement.style.cursor = 'crosshair';
}

export function manageMKeyUp() {
    enableMeasurement = false;
    orbitControls.enabled = true;
    renderer.domElement.style.cursor = 'pointer';
}

// Function to handle 'a' key down
export function manageAKeyDown() {
    if (hasActiveMeasurement) return; // Prevent new measurement if an active one exists

    enableAreaMeasurement = true; // Enable point selection
    orbitControls.enabled = false;
    renderer.domElement.style.cursor = 'crosshair';
}

// Function to handle 'a' key up
export function manageAKeyUp() {
    enableAreaMeasurement = false;
    orbitControls.enabled = true;
    renderer.domElement.style.cursor = 'pointer';

     if (areaPoints.length >= 3 && !hasAreaMeasurement) {
        const area = calculateArea(areaPoints);
        console.log(`Area: ${area.toFixed(2)} square metres`);
        drawPolygon(areaPoints); // Draw the polygon based on selected area points
        populateAreaMeasurementContainer(area); // Display area details in the sidebar
    } else if (!hasAreaMeasurement) {
        clearMeasurement();
    }
}

export function handleMeasurementClick(event) {
    if (enableMeasurement || enableAreaMeasurement) {
        addPoint(event);
    }
}

// Function to add a point to points array and mark with a dot
export function addPoint(event) { 
    // Check for intersection with objects
    let intersects = checkIntersection(event);
    if (intersects) {
        const point = intersects.point; // Get the intersection point

        // If measurement mode is enabled
        if (enableMeasurement) {      
            currentMeasurement.lastPoint = point;
            currentMeasurement.points.push(point); // Add the point to the measurement array
            const dot = addDot(point); // Mark the point with a dot
            currentMeasurement.lastDot = dot;
            currentMeasurement.dots.push(dot); // Add the dot to the current measurement's dots array
            
            if (currentMeasurement.points.length === 1) {
                populateMeasurementContainer(currentMeasurement);
            }
            // Calculate distance from the previous point if it exists
            if (currentMeasurement.points.length > 1) {
                const previousPoint = currentMeasurement.points[currentMeasurement.points.length - 2]; // Get the last point added
                const distance = calculateDistance(previousPoint, point); // Calculate distance to the new point
                currentMeasurement.lastDistance = distance;
                currentMeasurement.distances.push(distance); // Add the distance to the distances array
                currentMeasurement.totalDistance += distance; // Update total distance

                currentMeasurement.lastLine = drawLine(currentMeasurement.points);
                addLabel();
                populateMeasurementContainer(currentMeasurement);
                hasActiveMeasurement = true;

                // Display the distance between the two points
                console.log(`Distance from point ${currentMeasurement.points.length - 2} to point ${currentMeasurement.points.length - 1}: ${distance.toFixed(2)} units`);
            }

        } else if (enableAreaMeasurement) { // If 'a' key is pressed, handle area calculation        
            areaPoints.push(point); // Add to area points
            const areaDot = addDot(point); // Mark the point with a dot
            areaDots.push(areaDot);

            if (areaPoints.length >= 3) {
                hasActiveMeasurement = true; // Prevent further measurements until cleared
            }
        }
    }
}

// Function to add a dot at a given point with a specified color
function addDot(position, color = 0xff0000, trackDot = true) {
    const geometry = new THREE.SphereGeometry(dotSize, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    const dot = new THREE.Mesh(geometry, material);
    dot.position.copy(position);
    dot.userData.type = "dot";
    dot.userData.interactive = true; // Mark as interactive
    dot.name = "dot";
    scene.add(dot);

    return dot; // Return the created dot
}

// Function to draw a line between two points
function drawLine(points) {
    if (points.length < 2) return;

    const start = points[points.length - 2];
    const end = points[points.length - 1];

    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

    const line = new THREE.Line(geometry, material);
    line.userData.type = "measurementLine";
    line.userData.start = start;
    line.userData.end = end;
    scene.add(line);
    currentMeasurement.lines.push(line);
    return line; // Return the created line
}

// Helper function to remove all labels from a line
function removeLabelsFromLine(line) {
    const labelsToRemove = [];
    line.traverse(child => {
        if (child.isCSS2DObject) {
            labelsToRemove.push(child);
        }
    });
    labelsToRemove.forEach(label => {
        label.removeFromParent();
        scene.remove(label);
    });
}

// Undo the last point
export function undoLastPoint() {
    if (currentMeasurement.points.length > 0) {
        // Remove last point
        currentMeasurement.points.pop();
        
        // Remove last dot
        if (currentMeasurement.lastDot) {
            scene.remove(currentMeasurement.lastDot);
            currentMeasurement.dots.pop();
        }
        
         // Remove last line and its CSS2D label
         if (currentMeasurement.lastLine) {
            removeLabelsFromLine(currentMeasurement.lastLine);
            scene.remove(currentMeasurement.lastLine);
            currentMeasurement.lines.pop();
        }
        
        // Update total distance
        if (currentMeasurement.lastDistance) {
            currentMeasurement.totalDistance -= currentMeasurement.lastDistance;
            currentMeasurement.distances.pop();
        }
        
        // Update measurement container
        populateMeasurementContainer(currentMeasurement);
        
        // Reset last elements
        currentMeasurement.lastPoint = currentMeasurement.points[currentMeasurement.points.length - 1] || null;
        currentMeasurement.lastDot = currentMeasurement.dots[currentMeasurement.dots.length - 1] || null;
        currentMeasurement.lastDistance = currentMeasurement.distances[currentMeasurement.distances.length - 1] || 0;
        currentMeasurement.lastLine = currentMeasurement.lines[currentMeasurement.lines.length - 1] || null;

        // If all points are removed, reset measurement
        if (currentMeasurement.points.length === 0) {
            clearMeasurement();
        }
    }
}

// Function to measure distance between two points
function calculateDistance(pointA, pointB) {
    return pointA.distanceTo(pointB); // Returns the distance between two points
}

export function addLabel(measurementGroup = null) {
    let lines;
    if (measurementGroup) {
        // For saved measurements
        lines = measurementGroup.children.filter(child => child.userData.type === 'measurementLine');
        console.log("lines", lines);
    } else {
        // For current measurement
        lines = currentMeasurement.lines;
        console.log("Current Measurement lines to label", lines);
    }

    lines.forEach((line, index) => {
        console.log("line", line);
        const start = line.userData.start;
        console.log("start", start);
        const end = line.userData.end;
        console.log("end", end);

        if (!start || !end) {
            console.warn('Line missing start or end point', line);
            return; // Skip this line if start or end is missing
        }

        const distance = start.distanceTo(end);
        console.log("distance", distance);
        const innerText = `${distance.toFixed(2)} m`;
        console.log("innerText", innerText);

        const measurementDiv = document.createElement('div');
        measurementDiv.className = 'measurementLabel';
        measurementDiv.style.backgroundColor = '#fff';
        measurementDiv.style.border = '1px solid #ccc';
        measurementDiv.style.borderRadius = '5px';
        measurementDiv.style.padding = '5px';
        measurementDiv.style.fontFamily = 'Arial, sans-serif';
        measurementDiv.style.pointerEvents = 'none';
        measurementDiv.innerText = innerText;

        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        console.log("midPoint", midPoint);
        const offsetY = 1;
        const measurementLabel = new CSS2DObject(measurementDiv);
        measurementLabel.position.y += offsetY;

        if (!measurementGroup) {
            measurementLabel.position.copy(midPoint);
        }

        line.add(measurementLabel); // Attach the label to the line
    });
}

function populateMeasurementContainer(currentMeasurement) {
    console.log("Populate Current Measurement", currentMeasurement);
    const sidebar = document.getElementById('newMeasurementSidebar');
    sidebar.classList.remove('d-none');

    const totalDistance = currentMeasurement.totalDistance.toFixed(2);

    // Create inner HTML for displaying points and distances
    let innerHTML = `<p class="mb-1">Total Distance: ${totalDistance} units</p>`;

    // Display each point and the distance to the next point
    for (let i = 0; i < currentMeasurement.points.length; i++) {
        innerHTML += `<p class="mb-1">Point ${i + 1}: x: ${(currentMeasurement.points[i].x).toFixed(2)}, y: ${(currentMeasurement.points[i].y).toFixed(2)}, z: ${(currentMeasurement.points[i].z).toFixed(2)}</p>`;
        if (i > 0) {
            innerHTML += `<p class="mb-1">Distance from Point ${i} to Point ${i + 1}: ${currentMeasurement.distances[i - 1].toFixed(2)} units</p>`;
        }
    }
    
    // Check if the current measurement container already exists
    if (measurementContainer) {
        // Update the existing container's inner HTML
        measurementContainer.innerHTML = innerHTML; // Update the inner HTML
    } else {
        // Create a new div element if it doesn't exist
        measurementContainer = document.createElement('div');
        measurementContainer.className = 'measurementText'
        measurementContainer.style.backgroundColor = '#fff';
        measurementContainer.style.padding = '5px';
        measurementContainer.style.fontFamily = 'Arial, sans-serif';
        measurementContainer.innerHTML = innerHTML; // Set the inner HTML

        sidebar.appendChild(measurementContainer); // Append the new div to the container
    }   

     // Create or update the button container
     let buttonContainer = sidebar.querySelector('.buttonContainer');
     if (!buttonContainer) {
         buttonContainer = document.createElement('div');
         buttonContainer.className = 'd-flex justify-content-end btn-group btn-group-sm w-100 buttonContainer';
         sidebar.appendChild(buttonContainer);
     }
 
     // Undo button
    let undoButton = document.getElementById('undoMeasurement');
    if (!undoButton) {
        undoButton = document.createElement('a');
        undoButton.href = '#';
        undoButton.id = 'undoMeasurement';
        undoButton.className = 'btn btn-sm btn-warning align-self-end';
        undoButton.innerText = 'Undo';
        undoButton.addEventListener('click', (event) => {
            event.preventDefault();
            undoLastPoint();
        });
        if (currentMeasurement.points.length >= 2) {
            buttonContainer.appendChild(undoButton);
        }
    }

     // Clear button
     let clearMeasurementButton = document.getElementById('clearMeasurement');
     if (!clearMeasurementButton) {
        clearMeasurementButton = document.createElement('a');
        clearMeasurementButton.href = '#';
        clearMeasurementButton.id = 'clearMeasurement';
        clearMeasurementButton.className = 'btn btn-sm btn-primary align-self-end';
        clearMeasurementButton.innerText = 'Clear';
        clearMeasurementButton.addEventListener('click', (event) => {
         event.preventDefault(); // Prevent default anchor behavior
         clearMeasurement(); // Call the clearMeasurement function
     });
     buttonContainer.appendChild(clearMeasurementButton);
    }

     // Save button
     let saveMeasurementButton = document.getElementById('saveMeasurement');
     if (!saveMeasurementButton) {
        saveMeasurementButton = document.createElement('a');
        saveMeasurementButton.href = '#';
        saveMeasurementButton.id = 'saveMeasurement';
        saveMeasurementButton.className = 'btn btn-sm btn-secondary align-self-end';
        saveMeasurementButton.innerText = 'Save';
     }
 
     // Only show the save button if there are at least 2 points
     if (currentMeasurement.points.length >= 2) {
         saveMeasurementButton.addEventListener('click', (event) => {
             event.preventDefault(); // Prevent default anchor behavior
             console.log("Saving measurement", currentMeasurement.points);
             openSaveModal(currentMeasurement); // Call the function to open the save modal
         });
         buttonContainer.appendChild(saveMeasurementButton);
     }
}

// Function to draw a polygon around the selected points
export function drawPolygon(areaPoints) {
    // Convert Vector3 points to Vector2 to create a polygon
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const geometry = new THREE.BufferGeometry().setFromPoints(areaPoints);
    polygon = new THREE.LineLoop(geometry, material);
    scene.add(polygon);
}

export function calculateArea(points) {
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
export function populateAreaMeasurementContainer(area) {
    const innerHTML = `<p class="mb-1">Area: ${area.toFixed(2)} square metres</p>`;

    const sidebar = document.getElementById('newMeasurementSidebar');
    newMeasurementSidebar.classList.remove('d-none');

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

// Function to clear all measurements
export function clearMeasurement() {
    console.log("Clearing measurement: areaPoints: ", areaPoints, "polygon: ", polygon, "measurementLabel: ", measurementLabel, "currentMeasurement.dots: ", currentMeasurement.dots, "currentMeasurement: ", currentMeasurement);
    
    hasActiveMeasurement = false;
    hasAreaMeasurement = false;
    enableMeasurement = false;
    enableAreaMeasurement = false;
    areaPoints = [];  // Clear area points
    areaDots.forEach(dot => scene.remove(dot));
    
    if (polygon) scene.remove(polygon);  // Remove area polygon

    // Clear currentMeasurement data
    console.log("Clearing currentMeasurement: ", currentMeasurement);
    currentMeasurement.dots.forEach(dot => scene.remove(dot));
    // Remove all lines and their labels
      currentMeasurement.lines.forEach(line => {
        removeLabelsFromLine(line);
        scene.remove(line);
    });
    currentMeasurement = { 
        points: [], 
        distances: [], 
        totalDistance: 0, 
        dots: [], 
        lines: [],
        lastPoint: null,
        lastDot: null,
        lastLine: null,
        lastDistance: 0
    };

    // Clear the measurement container content
    if (measurementContainer) {
        measurementContainer.innerHTML = ''; // Clear the content of the measurement container
    }

    // Check if there are no points in currentMeasurement
    if (currentMeasurement.points.length === 0) {
        const sidebar = document.getElementById('newMeasurementSidebar');
        sidebar.classList.add('d-none'); // Hide the sidebar if no measurements exist
    }
    // alert('Alert clearMeasurement');
}

// Function to fetch and display saved measurements
export function fetchAndDisplaySavedMeasurements() {
    const savedMeasurementsContent = document.getElementById('savedMeasurementsContent');
    savedMeasurementsContent.innerHTML = ''; // Clear existing measurements

    fetch('/measurements')
        .then(response => response.json())
        .then(data => {
            console.log('Fetched measurements:', data); // Log the fetched data
            data.forEach(measurement => {
                // console.log("measurement", measurement);
                displaySavedMeasurement(measurement);
                addSavedMeasurementToSidebar(measurement);
            });
        })
        .catch(error => console.error('Error fetching measurements:', error));
}

// Function to display a saved measurement
function displaySavedMeasurement(measurement) {
    // Create a group to hold the line and dots
    const measurementGroup = new THREE.Group();
    measurementGroup.name = measurement.name;
    measurementGroup.userData.type = "measurementGroup";
    measurementGroup.userData.measurementId = measurement.id; // Store the measurement ID in the group
    measurementGroup.userData.colour = measurement.colour;
    measurementGroup.userData.name = measurement.name;
    measurementGroup.userData.totalDistance = measurement.total_distance;

    // Create an array to hold the points for the line
    const pointsArray = measurement.points.map(point => 
        new THREE.Vector3(point.x, point.y, point.z)
    );

    // Iterate through the points to create cylinders between each pair of points
    for (let i = 0; i < pointsArray.length - 1; i++) {
        const start = pointsArray[i];
        const end = pointsArray[i + 1];

        // Calculate the direction vector from start to end
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length(); // Get the length of the line segment

        // Create a cylinder geometry
        const geometry = new THREE.CylinderGeometry(0.09, 0.09, length, 8); // Radius and segments
        console.log("measurement.colour", measurement.colour);
        // Create a material for the cylinder
        const material = new THREE.MeshStandardMaterial({ color: measurement.colour }); // Blue color for saved measurements

        // Create the cylinder mesh
        const line = new THREE.Mesh(geometry, material);

        // Set the position of the cylinder to the midpoint between start and end
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        line.position.copy(midPoint);

        // Set the rotation of the cylinder to align with the direction vector
        line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

        // Set user data for the line
        line.userData.type = "measurementLine"; // Set user data for identification
        line.userData.measurementId = measurement.id; // Store the measurement ID in the line's userData
        line.userData.start = start;
        line.userData.end = end;    
        line.userData.name = measurement.name;
        line.userData.length = length;
        
        // Add the cylinder to the measurement group
        measurementGroup.add(line);
    }

    // Add dot markers at the start and end points
    pointsArray.forEach(point => {
        const dot = addDot(point, measurement.colour); // Add a blue dot at each point
        measurementGroup.add(dot); // Add the dot to the measurement group
    });

    // Add the measurement group to the scene
    scene.add(measurementGroup);
    objectsToIntersect.push(measurementGroup); // Add the group to objectsToIntersect for selection
}

// Function to add saved measurement details to the sidebar
function addSavedMeasurementToSidebar(measurement) {
    const savedMeasurementsContent = document.getElementById('savedMeasurementsContent');

    const measurementContainer = document.createElement('div');
    measurementContainer.className = 'measurementText';
    measurementContainer.dataset.measurementId = measurement.id; // Store the measurement ID in a data attribute

    // Ensure measurement.distance exists before calling toFixed
    const savedDistance = measurement.total_distance ? measurement.total_distance.toFixed(2) : 'N/A';

    // Alternate background color based on the current index
    const backgroundColor = measurementIndex % 2 === 0 ? '#f0f0f0' : '#ffffff'; // Light gray and white
    measurementContainer.style.backgroundColor = backgroundColor;
    measurementContainer.style.width = '100%';
    measurementContainer.style.padding = '5px';
    measurementContainer.style.fontFamily = 'Arial, sans-serif';
    measurementContainer.style.fontSize = '10px';
    measurementContainer.innerHTML = `
        <p class="mb-1">Name: ${measurement.name}</p>
        <p class="mb-1">Distance: ${savedDistance} metres</p>
    `;

    savedMeasurementsContent.appendChild(measurementContainer);

    measurementIndex++; // Increment the counter after each call
}

export function addMeasurement(currentMeasurement) {
    openSaveModal(currentMeasurement);
}

export function editMeasurement(measurementGroup) {
    openEditMeasurementModal(measurementGroup);
}

export function deleteMeasurement(measurementGroup) {
    const measurementId = measurementGroup.userData.measurementId;
    deleteMeasurementRequest(measurementId)
        .then(response => {
            console.log('Measurement deleted:', response.data);
            removeMeasurementFromScene(measurementGroup);
            removeMeasurementFromSidebar(measurementId);
            removeMeasurementLabels(measurementGroup)
            showMessage('Measurement deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting measurement:', error);
            showMessage('Error deleting measurement', 'error');
        });
}

export function updateMeasurement(measurementId, formData) {
    updateMeasurementRequest(measurementId, formData)
        .then(response => {
            console.log('Measurement updated:', response.data);
            removeBackdrop();
            // Update the measurement in the scene and sidebar if necessary
            showMessage('Measurement updated successfully');
        })
        .catch(error => {
            console.error('Error updating measurement:', error);
            showMessage('Error updating measurement', 'error');
        });
}

function removeMeasurementFromScene(measurementGroup) {
    scene.remove(measurementGroup);
    const index = objectsToIntersect.indexOf(measurementGroup);
    if (index > -1) {
        objectsToIntersect.splice(index, 1);
    }
}

function removeMeasurementFromSidebar(measurementId) {
    const measurementContainer = document.querySelector(`.measurementText[data-measurement-id="${measurementId}"]`);
    if (measurementContainer) {
        measurementContainer.remove();
    }   
}

// Remove labels from all measurement lines
export function removeMeasurementLabels(measurementGroup) {
    console.log("removeMeasurementLabels", measurementGroup);
    measurementGroup.traverse((object) => {
        if (object.userData.type === 'measurementLine') {
            object.children = object.children.filter(child => {
                if (child.isCSS2DObject) {
                    console.log("removing label", child);  
                    object.remove(child);
                    return false;
                }
                return true;
            });
        }
    });
}
