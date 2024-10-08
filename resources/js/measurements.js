import { scene,  orbitControls, renderer, checkIntersection, objectsToIntersect } from './scene.js';
import axios from 'axios';
import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'

let points = []; // Store selected points for measurement
let areaPoints = []; // Store selected points for area measurement
let line; // Line object to visualize the distance
let polygon; // Polygon object to visualize the area
let dot; // Dot object to visualize the distance
const dotSize = 0.5; // Size of the dots
let dots = [];
// let measurement = 0;
let measurementLabel;
let enableMeasurement = false;
let enableAreaMeasurement = false;
let hasActiveMeasurement = false;
let currentMeasurement = { points: [], distances: [], totalDistance: 0, dots: [] }; // Object to store the current measurement datalet hasActiveMeasurement = false;
let hasAreaMeasurement = false;
let measurementIndex = 0; // Initialize a counter outside the function
// let distances = []; // Array to hold distances between points
export let measurementLabels = []; // Array to store measurement labels
let measurementContainer;


export function manageMKeyDown() {
    enableMeasurement = true;
    orbitControls.enabled = false;
    renderer.domElement.style.cursor = 'crosshair';

    // console.log("Current Measurement", currentMeasurement);
}

export function manageMKeyUp() {
    enableMeasurement = false;
    orbitControls.enabled = true;
    renderer.domElement.style.cursor = 'pointer';

    // If there are points, finalize the measurement
    if (currentMeasurement.points.length > 0) {
        // console.log("Current Measurement", currentMeasurement);
        hasActiveMeasurement = true;
        // populateMeasurementContainer(currentMeasurement); 
        if (currentMeasurement.points.length > 1) {
            // Draw the line and update the measurement container
            drawLine(currentMeasurement.points); // Draw the line connecting all points
        }
    }
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
            currentMeasurement.points.push(point); // Add the point to the measurement array
            const dot = addDot(point); // Mark the point with a dot
            currentMeasurement.dots.push(dot); // Add the dot to the current measurement's dots array
            
            // Calculate distance from the previous point if it exists
            if (currentMeasurement.points.length > 1) {
                const previousPoint = currentMeasurement.points[currentMeasurement.points.length - 2]; // Get the last point added
                const distance = calculateDistance(previousPoint, point); // Calculate distance to the new point
                currentMeasurement.distances.push(distance); // Add the distance to the distances array
                currentMeasurement.totalDistance += distance; // Update total distance

                addLabel(currentMeasurement.points);
                populateMeasurementContainer(currentMeasurement);

                // Display the distance between the two points
                console.log(`Distance from point ${currentMeasurement.points.length - 2} to point ${currentMeasurement.points.length - 1}: ${distance.toFixed(2)} units`);
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

    // // Only push to dots array if trackDot is true
    // if (trackDot) {
    //     dots.push(dot);
    // }

    return dot; // Return the created dot
}

// Function to draw a line between two points
function drawLine(points) {
    if (points.length < 2) return; // Need at least two points to draw a line

    const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );

    line = new THREE.Line( geometry, material );
    scene.add(line);
}

// Function to measure distance between two points
function calculateDistance(pointA, pointB) {
    return pointA.distanceTo(pointB); // Returns the distance between two points
}

// Add CSS2DObject Label between points
export function addLabel(points) {
    // Iterate through the points to create labels for each segment
    for (let i = 0; i < points.length - 1; i++) {
        const start = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        const end = new THREE.Vector3(points[i + 1].x, points[i + 1].y, points[i + 1].z);

        // Calculate the distance between the two points
        const distance = start.distanceTo(end);
        const innerText = `${distance.toFixed(2)} m`; // Format the distance

        // Create a div for the label
        const measurementDiv = document.createElement('div');
        measurementDiv.className = 'measurementLabel';
        measurementDiv.style.backgroundColor = '#fff';
        measurementDiv.style.border = '1px solid #ccc';
        measurementDiv.style.borderRadius = '5px';
        measurementDiv.style.padding = '5px';
        measurementDiv.style.fontFamily = 'Arial, sans-serif';
        measurementDiv.pointerEvents = 'auto';
        measurementDiv.innerText = innerText;

        // Calculate the midpoint of the line segment
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        const offsetY = 1; // Adjust this value to move the label higher or lower
        const measurementLabel = new CSS2DObject(measurementDiv);
        measurementLabel.position.set(midPoint.x, midPoint.y + offsetY, midPoint.z); // Adjust y position

        // Add the label to the scene
        scene.add(measurementLabel);
        measurementLabels.push(measurementLabel); // Store the label reference
    }
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

// Function to open the save modal
function openSaveModal(currentMeasurement) {
    console.log("totalDistance", currentMeasurement.totalDistance);
    // Clear previous values in the modal
    const pointContainer = document.getElementById('pointsContainer');
    pointContainer.innerHTML = ''; // Clear existing points

    // Populate the modal fields with points
    currentMeasurement.points.forEach((point, index) => {
        // Create input fields for each point
        const pointDiv = document.createElement('div');
        pointDiv.className = 'point-input';

        pointDiv.innerHTML = `
            <label>Point ${index + 1}:</label>
            <div class="row">
                <div class="col">
                    <div class="input-group mb-3">
                        <span class="input-group-text">x</span>
                        <input type="number" class="form-control" id="point${index + 1}_x" value="${point.x.toFixed(2)}" required>
                    </div>
                </div>
                <div class="col">
                    <div class="input-group mb-3">
                        <span class="input-group-text">y</span>
                        <input type="number" class="form-control" id="point${index + 1}_y" value="${point.y.toFixed(2)}" required>
                    </div>
                </div>
                <div class="col">
                    <div class="input-group mb-3">
                        <span class="input-group-text">z</span>
                        <input type="number" class="form-control" id="point${index + 1}_z" value="${point.z.toFixed(2)}" required>
                    </div>
                </div>
            </div>
        `;

        pointContainer.appendChild(pointDiv);
    });

    // Set the distance value, ensuring totalDistance is a number
    document.getElementById('total_distance').value = parseFloat(currentMeasurement.totalDistance).toFixed(2); // Format to 2 decimal places

    // Show the modal
    const saveMeasurementModal = new bootstrap.Modal(document.getElementById('saveMeasurementModal'));
    saveMeasurementModal.show();

    // Add event listener for form submission
    const saveMeasurementForm = document.getElementById('saveMeasurementForm');
    saveMeasurementForm.onsubmit = function(event) {
        event.preventDefault(); // Prevent default form submission

        // Create an object to hold the form data
        const formData = {
            name: document.getElementById('measurementName').value,
            total_distance: document.getElementById('total_distance').value,
            points: [] // Initialize an array for points
        };

        // Collect points from the modal inputs
        currentMeasurement.points.forEach((_, index) => {
            formData.points.push({
                x: parseFloat(document.getElementById(`point${index + 1}_x`).value),
                y: parseFloat(document.getElementById(`point${index + 1}_y`).value),
                z: parseFloat(document.getElementById(`point${index + 1}_z`).value)
            });
        });

        console.log('Form Data:', formData);
        // Send the data using Axios
        axios.post(saveMeasurementForm.action, formData, {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') // Include CSRF token
            }
        })
        .then(response => {
            console.log('Measurement saved:', response.data);
            // Close the modal and clear the form
            saveMeasurementModal.hide();
            clearMeasurement(); // Clear the measurement points if needed
            // Fetch and display the newly saved measurement
            fetchAndDisplaySavedMeasurements(); // Call this function to update the UI
        })
        .catch(error => {
            console.error('Error saving measurement:', error);
        });
    };
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
    console.log("Clearing measurement: areaPoints: ", areaPoints, "line: ", line, "polygon: ", polygon, "measurementLabel: ", measurementLabel, "currentMeasurement.dots: ", currentMeasurement.dots, "currentMeasurement: ", currentMeasurement);
    
    // Clear area points
    areaPoints = [];
    
    // Remove the current line if it exists
    if (line) {
        scene.remove(line); // Ensure the line is removed from the scene
        line = null; // Clear the reference
    }
    
    // Remove other objects
    if (polygon) scene.remove(polygon);
    currentMeasurement.dots.forEach(dot => scene.remove(dot));
    
    // Clear measurement data
    currentMeasurement = { points: [], distances: [], totalDistance: 0, dots: [] }; // Reset current measurement
    hasActiveMeasurement = false;
    enableMeasurement = false;
    enableAreaMeasurement = false;
    measurementLabels.forEach(label => scene.remove(label));
    measurementLabels = [];
    
    // Clear the measurement container content
    if (measurementContainer) {
        measurementContainer.innerHTML = ''; // Clear the content of the measurement container
    }

    // Check if there are no points in currentMeasurement
    if (currentMeasurement.points.length === 0) {
        const sidebar = document.getElementById('newMeasurementSidebar');
        sidebar.classList.add('d-none'); // Hide the sidebar if no measurements exist
    }
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
    measurementGroup.userData.measurementId = measurement.id; // Store the measurement ID in the group

    // Create an array to hold the points for the line
    const pointsArray = measurement.points.map(point => 
        new THREE.Vector3(point.x, point.y, point.z)
    );

    // Check if there are enough points to draw a line
    if (pointsArray.length < 2) return; // Need at least two points to draw a line

    // Iterate through the points to create cylinders between each pair of points
    for (let i = 0; i < pointsArray.length - 1; i++) {
        const start = pointsArray[i];
        const end = pointsArray[i + 1];

        // Calculate the direction vector from start to end
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length(); // Get the length of the line segment

        // Create a cylinder geometry
        const geometry = new THREE.CylinderGeometry(0.09, 0.09, length, 8); // Radius and segments

        // Create a material for the cylinder
        const material = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue color for saved measurements

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
        
        // Add the cylinder to the measurement group
        measurementGroup.add(line);
    }

    // Add dot markers at the start and end points
    pointsArray.forEach(point => {
        const dot = addDot(point, 0x0000ff); // Add a blue dot at each point
        measurementGroup.add(dot); // Add the dot to the measurement group
    });

    // Add the measurement group to the scene
    scene.add(measurementGroup);
    objectsToIntersect.push(measurementGroup); // Add the group to objectsToIntersect for selection

    // Call addLabel to display distances between points
    // addLabel(pointsArray);
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