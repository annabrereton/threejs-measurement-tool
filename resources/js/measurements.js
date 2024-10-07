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
let measurement = 0;
let measurementLabel;
let enableMeasurement = false;
let enableAreaMeasurement = false;
let isMeasuring = false;
let hasActiveMeasurement = false;
let hasAreaMeasurement = false;
let measurementIndex = 0; // Initialize a counter outside the function


// Function to handle 'm' key down
export function manageMKeyDown() {
    if (hasActiveMeasurement) return; // Prevent new measurement if an active one exists

    enableMeasurement = true;
    orbitControls.enabled = false;
    renderer.domElement.style.cursor = 'crosshair';
}

// Function to handle 'm' key up
export function manageMKeyUp() {
    enableMeasurement = false;
    orbitControls.enabled = true;
    renderer.domElement.style.cursor = 'pointer';
    if (isMeasuring) {
        scene.remove(line); // Remove the last line because it wasn't committed
        isMeasuring = false;
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

// Function to add a dot at a given point with a specified color
function addDot(position, color = 0xff0000, trackDot = true) {
    const geometry = new THREE.SphereGeometry(dotSize, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    const dot = new THREE.Mesh(geometry, material);
    dot.position.copy(position);
    dot.userData.type = "dot";
    dot.name = "dot";
    scene.add(dot);

    // Only push to dots array if trackDot is true
    if (trackDot) {
        dots.push(dot);
    }

    return dot; // Return the created dot
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

function populateMeasurementContainer(points) {
    const measurement = measureDistance(points);
    const innerHTML = `
    <p class="mb-1">Point 1: x: ${(points[0].x).toFixed(2)}, y: ${(points[0].y).toFixed(2)}, z: ${(points[0].z).toFixed(2)}</p>
    <p class="mb-1">Point 2: x: ${(points[1].x).toFixed(2)}, y: ${(points[1].y).toFixed(2)}, z: ${(points[1].z).toFixed(2)}</p>
    <p class="mb-1">Distance: ${measurement} metres</p>`;
    
    const sidebar = document.getElementById('newMeasurementSidebar');
    sidebar.classList.remove('d-none');
    
    // Create a new div element
    const measurementContainer = document.createElement('div');
    measurementContainer.className = 'measurementText'
    measurementContainer.style.backgroundColor = '#fff';
    measurementContainer.style.padding = '5px';
    measurementContainer.style.fontFamily = 'Arial, sans-serif';
    measurementContainer.innerHTML = innerHTML; // Set the inner HTML

    sidebar.appendChild(measurementContainer); // Append the new div to the container

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'd-flex justify-content-end btn-group btn-group-sm w-100';
    sidebar.appendChild(buttonContainer);

    // Clear button
    const clearMeasurementButton = document.createElement('a');
    clearMeasurementButton.href = '#';
    clearMeasurementButton.id = 'clearMeasurement';
    clearMeasurementButton.className = 'btn btn-sm btn-primary align-self-end';
    clearMeasurementButton.innerText = 'Clear';
    clearMeasurementButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        clearMeasurement(); // Call the clearMeasurement function
    });
    buttonContainer.appendChild(clearMeasurementButton);

    // Save button
    const saveMeasurementButton = document.createElement('a');
    saveMeasurementButton.href = '#';
    saveMeasurementButton.id = 'saveMeasurement';
    saveMeasurementButton.className = 'btn btn-sm btn-secondary align-self-end';
    saveMeasurementButton.innerText = 'Save';
    saveMeasurementButton.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor behavior
        console.log("Saving measurement", points, measurement);
        openSaveModal(points, measurement); // Call the function to open the save modal
    });
    buttonContainer.appendChild(saveMeasurementButton);
}

// Function to open the save modal
function openSaveModal(points, measurement) {
    // Populate the modal fields
    document.getElementById('point1_x').value = points[0].x.toFixed(2);
    document.getElementById('point1_y').value = points[0].y.toFixed(2);
    document.getElementById('point1_z').value = points[0].z.toFixed(2);
    
    document.getElementById('point2_x').value = points[1].x.toFixed(2);
    document.getElementById('point2_y').value = points[1].y.toFixed(2);
    document.getElementById('point2_z').value = points[1].z.toFixed(2);
    
    document.getElementById('distance').value = measurement; // Only the numeric value
    
    // Show the modal
    const saveMeasurementModal = new bootstrap.Modal(document.getElementById('saveMeasurementModal'));
    saveMeasurementModal.show();

        // Add event listener for form submission
        const saveMeasurementForm = document.getElementById('saveMeasurementForm');
        saveMeasurementForm.onsubmit = function(event) {
            event.preventDefault(); // Prevent default form submission
    
            // Create an object to hold the form data
            const formData = {
                point1_x: document.getElementById('point1_x').value,
                point1_y: document.getElementById('point1_y').value,
                point1_z: document.getElementById('point1_z').value,
                point2_x: document.getElementById('point2_x').value,
                point2_y: document.getElementById('point2_y').value,
                point2_z: document.getElementById('point2_z').value,
                distance: document.getElementById('distance').value,
                name: document.getElementById('measurementName').value
            };
    
            // Send the data using Axios
            axios.post(saveMeasurementForm.action, formData, {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') // Include CSRF token
                }
            })
            .then(response => {
                console.log('Measurement saved:', response.data);
                // Optionally, close the modal and clear the form
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
export function clearMeasurement() {
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
    const sidebar = document.getElementById('newMeasurementSidebar');
    sidebar.innerHTML = ''; // Clear all measurement details
    sidebar.classList.add('d-none');
}

// Function to fetch and display saved measurements
export function fetchAndDisplaySavedMeasurements() {
    const savedMeasurementsContent = document.getElementById('savedMeasurementsContent');
    savedMeasurementsContent.innerHTML = ''; // Clear existing measurements

    fetch('/measurements')
        .then(response => response.json())
        .then(data => {
            data.forEach(measurement => {
                console.log("measurement", measurement);
                displaySavedMeasurement(measurement);
                addSavedMeasurementToSidebar(measurement);
            });
        })
        .catch(error => console.error('Error fetching measurements:', error));
}

// Function to display a saved measurement
function displaySavedMeasurement(measurement) {
    const start = new THREE.Vector3(measurement.point1_x, measurement.point1_y, measurement.point1_z);
    const end = new THREE.Vector3(measurement.point2_x, measurement.point2_y, measurement.point2_z);

    // Create a group to hold the line and dots
    const measurementGroup = new THREE.Group();
    measurementGroup.userData.measurementId = measurement.id; // Store the measurement ID in the group

    // Draw line with a cylinder geometry for better selection
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue color for saved measurements
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    // Create a cylinder geometry to represent the line
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8); // Adjust the radius as needed
    const line = new THREE.Mesh(geometry, material);
    line.position.copy(midPoint);
    
    // Set the rotation of the line to point from start to end
    line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

    line.userData.type = "measurementLine"; // Set user data for identification
    measurementGroup.add(line); // Add the line to the group

    // Add dot markers
    const startDot = addDot(start, 0x0000ff, false); // Blue dot
    const endDot = addDot(end, 0x0000ff, false); // Blue dot
    measurementGroup.add(startDot); // Add the start dot to the group
    measurementGroup.add(endDot); // Add the end dot to the group

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

    // Alternate background color based on the current index
    const backgroundColor = measurementIndex % 2 === 0 ? '#f0f0f0' : '#ffffff'; // Light gray and white
    measurementContainer.style.backgroundColor = backgroundColor;
    measurementContainer.style.width = '100%';
    measurementContainer.style.padding = '5px';
    measurementContainer.style.fontFamily = 'Arial, sans-serif';
    measurementContainer.style.fontSize = '10px';
    measurementContainer.innerHTML = `
        <p class="mb-1">Name: ${measurement.name}</p>
        <p class="mb-1">Distance: ${measurement.distance.toFixed(2)} metres</p>
    `;

    savedMeasurementsContent.appendChild(measurementContainer);

    measurementIndex++; // Increment the counter after each call
}




// import { scene,  orbitControls, renderer, checkIntersection, objectsToIntersect } from './scene.js';
// import axios from 'axios';
// import * as THREE from 'three';
// import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer'

// let points = []; // Store selected points for measurement
// let areaPoints = []; // Store selected points for area measurement
// let line; // Line object to visualize the distance
// let currentLine = null; // Variable to store the current line being drawn
// let polygon; // Polygon object to visualize the area
// let dot; // Dot object to visualize the distance
// const dotSize = 0.5; // Size of the dots
// let dots = [];
// let measurement = 0;
// let measurementLabel;
// let enableMeasurement = false;
// let enableAreaMeasurement = false;
// let isMeasuring = false;
// let hasActiveMeasurement = false;
// let hasAreaMeasurement = false;
// let measurementIndex = 0; // Initialize a counter outside the function


// // Function to handle 'm' key down
// export function manageMKeyDown() {
//     if (hasActiveMeasurement) return; // Prevent new measurement if an active one exists

//     enableMeasurement = true;
//     orbitControls.enabled = false;
//     renderer.domElement.style.cursor = 'crosshair';
// }

// // Function to handle 'm' key up
// export function manageMKeyUp() {
//     enableMeasurement = false;
//     orbitControls.enabled = true;
//     renderer.domElement.style.cursor = 'pointer';
//     if (isMeasuring) {
//         scene.remove(line); // Remove the last line because it wasn't committed
//         isMeasuring = false;
//     }
// }

// // Function to handle 'a' key down
// export function manageAKeyDown() {
//     if (hasActiveMeasurement) return; // Prevent new measurement if an active one exists

//     enableAreaMeasurement = true; // Enable point selection
//     orbitControls.enabled = false;
//     renderer.domElement.style.cursor = 'crosshair';
// }

// // Function to handle 'a' key up
// export function manageAKeyUp() {
//     enableAreaMeasurement = false;
//     orbitControls.enabled = true;
//     renderer.domElement.style.cursor = 'pointer';

//      if (areaPoints.length >= 3 && !hasAreaMeasurement) {
//         const area = calculateArea(areaPoints);
//         console.log(`Area: ${area.toFixed(2)} square metres`);
//         drawPolygon(areaPoints); // Draw the polygon based on selected area points
//         populateAreaMeasurementContainer(area); // Display area details in the sidebar
//     }
// }

// export function handleMeasurementClick(event) {
//     if (enableMeasurement || enableAreaMeasurement) {
//         addPoint(event);
//     }
// }

// // Function to add a point to points array and mark with a dot
// export function addPoint(event) { 
//     // Check for intersection with objects
//     let intersects = checkIntersection(event);
//     if (intersects) {
//         const point = intersects.point; // Get the intersection point

//         // If measurement mode is enabled
//         if (enableMeasurement) {      
//             points.push(point); // Add the point to the measurement array
//             isMeasuring = true;

//             // If two points are selected, draw the line and measure distance
//             if (points.length === 2) {
//                 isMeasuring = false;
//                 const measurementData = { start: points[0], end: points[1] }; // Create measurement data
//                 const line = drawLine(points[0], points[1], measurementData); // Draw the line and pass measurement data

//                 // Create dots after the line is drawn
//                 const startDot = addDot(points[0], 0xff0000, true, measurementData); // Pass measurement data to the start dot
//                 const endDot = addDot(points[1], 0xff0000, true, measurementData); // Pass measurement data to the end dot

//                 // Update the measurement data to include references to the dots
//                 line.userData.startDot = startDot; // Reference to the start dot
//                 line.userData.endDot = endDot; // Reference to the end dot

//                 // Update the measurement data in the dots
//                 startDot.userData.measurementData = { line: line, otherDot: endDot }; // Store line and other dot in start dot
//                 endDot.userData.measurementData = { line: line, otherDot: startDot }; // Store line and other dot in end dot

//                 addLabel(points);
//                 populateMeasurementContainer(points);
//                 hasActiveMeasurement = true;
//             }
//         } else if (enableAreaMeasurement) { // If 'a' key is pressed, handle area calculation        
//             areaPoints.push(point); // Add to area points
//             addDot(point); // Mark the point with a dot

//             if (areaPoints.length >= 3) {
//                 hasActiveMeasurement = true; // Prevent further measurements until cleared
//             }
//         }
//     }
// }

// // Function to add a dot at a given point with a specified color
// function addDot(position, color = 0xff0000, trackDot = true, measurementData = null) {
//     const geometry = new THREE.SphereGeometry(dotSize, 16, 16);
//     const material = new THREE.MeshStandardMaterial({ color });
//     const dot = new THREE.Mesh(geometry, material);
//     dot.position.copy(position);
//     dot.userData.type = "dot";
//     dot.name = "dot";

//     // Store measurement data if provided
//     if (measurementData) {
//         dot.userData.measurementData = measurementData; // Store reference to measurement data
//     }

//     scene.add(dot);

//     // Only push to dots array if trackDot is true
//     if (trackDot) {
//         dots.push(dot);
//     }

//     return dot; // Return the created dot
// }

// function drawLine(start, end, measurementData) {
//     console.log("Drawing line from:", start, "to:", end); // Log the points

//     const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Use MeshBasicMaterial for visibility
//     const direction = new THREE.Vector3().subVectors(end, start);
//     const length = direction.length();
//     const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

//     // Create a cylinder geometry to represent the line
//     const geometry = new THREE.CylinderGeometry(0.09, 0.09, length, 8); // Adjust the radius as needed
//     const line = new THREE.Mesh(geometry, material);
//     line.position.copy(midPoint);
    
//     // Set the rotation of the line to point from start to end
//     line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

//     line.userData.type = "measurementLine"; // Set user data for identification
//     line.userData.measurementData = measurementData; // Store reference to measurement data
//     // line.userData.startDot = start; // Reference to the start dot
//     // line.userData.endDot = end; // Reference to the end dot

//     scene.add(line);    
//     objectsToIntersect.push(line); // Add the line to objectsToIntersect

//     currentLine = line; // Store the current line reference
//     return line; // Return the created line
// }

// // Function to draw a polygon around the selected points
// export function drawPolygon(areaPoints) {
//     // Convert Vector3 points to Vector2 to create a polygon
//     const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
//     const geometry = new THREE.BufferGeometry().setFromPoints(areaPoints);
//     polygon = new THREE.LineLoop(geometry, material);
//     scene.add(polygon);
// }

// export function calculateArea(points) {
//     let area = 0;
//     const n = points.length;

//     // Calculate the area using the 2D projection (ignoring y-axis, using x and z)
//     for (let i = 0; i < n; i++) {
//         const currentPoint = points[i];
//         const nextPoint = points[(i + 1) % n]; // Wrap around to the first point
        
//         // Use only the x and y coordinates for area calculation
//         area += currentPoint.x * nextPoint.z;
//         area -= nextPoint.x * currentPoint.z;
//     }

//     area = Math.abs(area) / 2; // Absolute value and divide by 2 to get the final area
//     console.log("area", area);
//     return area;
// }

// // Function to display area details in the sidebar
// export function populateAreaMeasurementContainer(area) {
//     const innerHTML = `<p class="mb-1">Area: ${area.toFixed(2)} square metres</p>`;

//     const sidebar = document.getElementById('newMeasurementSidebarm');
//     sidebar.classList.remove('d-none');

//     const measurementContainer = document.createElement('div');
//     measurementContainer.className = 'measurementText';
//     measurementContainer.style.backgroundColor = '#fff';
//     measurementContainer.style.padding = '5px';
//     measurementContainer.style.fontFamily = 'Arial, sans-serif';
//     measurementContainer.innerHTML = innerHTML;

//     sidebar.appendChild(measurementContainer);

//     const clearMeasurementButton = document.createElement('a');
//     clearMeasurementButton.href = '#';
//     clearMeasurementButton.id = 'clearMeasurement';
//     clearMeasurementButton.className = 'btn btn-sm btn-primary align-self-end';
//     clearMeasurementButton.innerText = 'Clear';
//     clearMeasurementButton.addEventListener('click', (event) => {
//         event.preventDefault(); 
//         clearMeasurement(); // Call the clear function to reset everything
//     });
//     sidebar.appendChild(clearMeasurementButton);
//     hasAreaMeasurement = true;
// }

// function populateMeasurementContainer(points) {
//     const measurement = measureDistance(points);
//     const innerHTML = `
//     <p class="mb-1">Point 1: x: ${(points[0].x).toFixed(2)}, y: ${(points[0].y).toFixed(2)}, z: ${(points[0].z).toFixed(2)}</p>
//     <p class="mb-1">Point 2: x: ${(points[1].x).toFixed(2)}, y: ${(points[1].y).toFixed(2)}, z: ${(points[1].z).toFixed(2)}</p>
//     <p class="mb-1">Distance: ${measurement} metres</p>`;
    
//     const sidebar = document.getElementById('newMeasurementSidebar');
//     sidebar.classList.remove('d-none');
    
//     // Create a new div element
//     const measurementContainer = document.createElement('div');
//     measurementContainer.className = 'measurementText'
//     measurementContainer.style.backgroundColor = '#fff';
//     measurementContainer.style.padding = '5px';
//     measurementContainer.style.fontFamily = 'Arial, sans-serif';
//     measurementContainer.innerHTML = innerHTML; // Set the inner HTML

//     sidebar.appendChild(measurementContainer); // Append the new div to the container

//     const buttonContainer = document.createElement('div');
//     buttonContainer.className = 'd-flex justify-content-end btn-group btn-group-sm w-100';
//     sidebar.appendChild(buttonContainer);

//     // Clear button
//     const clearMeasurementButton = document.createElement('a');
//     clearMeasurementButton.href = '#';
//     clearMeasurementButton.id = 'clearMeasurement';
//     clearMeasurementButton.className = 'btn btn-sm btn-primary align-self-end';
//     clearMeasurementButton.innerText = 'Clear';
//     clearMeasurementButton.addEventListener('click', (event) => {
//         event.preventDefault(); // Prevent default anchor behavior
//         clearMeasurement(); // Call the clearMeasurement function
//     });
//     buttonContainer.appendChild(clearMeasurementButton);

//     // Save button
//     const saveMeasurementButton = document.createElement('a');
//     saveMeasurementButton.href = '#';
//     saveMeasurementButton.id = 'saveMeasurement';
//     saveMeasurementButton.className = 'btn btn-sm btn-secondary align-self-end';
//     saveMeasurementButton.innerText = 'Save';
//     saveMeasurementButton.addEventListener('click', (event) => {
//         event.preventDefault(); // Prevent default anchor behavior
//         console.log("Saving measurement", points, measurement);
//         openSaveModal(points, measurement); // Call the function to open the save modal
//     });
//     buttonContainer.appendChild(saveMeasurementButton);
// }

// // Function to open the save modal
// function openSaveModal(points, measurement) {
//     // Populate the modal fields
//     document.getElementById('point1_x').value = points[0].x.toFixed(2);
//     document.getElementById('point1_y').value = points[0].y.toFixed(2);
//     document.getElementById('point1_z').value = points[0].z.toFixed(2);
    
//     document.getElementById('point2_x').value = points[1].x.toFixed(2);
//     document.getElementById('point2_y').value = points[1].y.toFixed(2);
//     document.getElementById('point2_z').value = points[1].z.toFixed(2);
    
//     document.getElementById('distance').value = measurement; // Only the numeric value
    
//     // Show the modal
//     const saveMeasurementModal = new bootstrap.Modal(document.getElementById('saveMeasurementModal'));
//     saveMeasurementModal.show();

//         // Add event listener for form submission
//         const saveMeasurementForm = document.getElementById('saveMeasurementForm');
//         saveMeasurementForm.onsubmit = function(event) {
//             event.preventDefault(); // Prevent default form submission
    
//             // Create an object to hold the form data
//             const formData = {
//                 point1_x: document.getElementById('point1_x').value,
//                 point1_y: document.getElementById('point1_y').value,
//                 point1_z: document.getElementById('point1_z').value,
//                 point2_x: document.getElementById('point2_x').value,
//                 point2_y: document.getElementById('point2_y').value,
//                 point2_z: document.getElementById('point2_z').value,
//                 distance: document.getElementById('distance').value,
//                 name: document.getElementById('measurementName').value
//             };
    
//             // Send the data using Axios
//             axios.post(saveMeasurementForm.action, formData, {
//                 headers: {
//                     'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content') // Include CSRF token
//                 }
//             })
//             .then(response => {
//                 console.log('Measurement saved:', response.data);
//                 // Optionally, close the modal and clear the form
//                 saveMeasurementModal.hide();
//                 clearMeasurement(); // Clear the measurement points if needed
//                  // Fetch and display the newly saved measurement
//                 fetchAndDisplaySavedMeasurements(); // Call this function to update the UI
//             })
//             .catch(error => {
//                 console.error('Error saving measurement:', error);
//             });
//         };
// }

// function addLabel(points) {
//     const innerText = measureDistance(points);
//     console.log("innerText", innerText);

//     const measurementDiv = document.createElement('div');
//     measurementDiv.className = 'measurementLabel'
//     measurementDiv.style.backgroundColor = '#fff';
//     measurementDiv.style.border = '1px solid #ccc';
//     measurementDiv.style.borderRadius = '5px';
//     measurementDiv.style.padding = '5px';
//     measurementDiv.style.fontFamily = 'Arial, sans-serif';
//     measurementDiv.pointerEvents = 'auto',
//     measurementDiv.innerText = innerText;
//     // measurementDiv.innerText = `${measurement.toFixed(2)}m`;

//     // Calculate the midpoint of the line
//     const midPoint = new THREE.Vector3().addVectors(points[0], points[1]).multiplyScalar(0.5);

//     const offsetY = 1; // Adjust this value to move the label higher or lower
//     measurementLabel = new CSS2DObject(measurementDiv);
//     measurementLabel.position.set(midPoint.x, midPoint.y + offsetY, midPoint.z); // Adjust y position
//     scene.add(measurementLabel);
// }

// // Function to measure distance between two points
// function measureDistance(points) {
//     if (points.length === 2) {
//         console.log(`Measurement: ${measurement.toFixed(2)} meters`);
//         measurement = points[0].distanceTo(points[1]);
//         return measurement.toFixed(2);
//     }
// }

// // // Function to clear all measurements
// export function clearMeasurement() {
//     console.log("Clearing measurement", points, areaPoints, line, polygon, measurementLabel, dots, measurement);
//     points = [];
//     areaPoints = [];
//     // Remove the current line if it exists
//     if (currentLine) {
//         scene.remove(currentLine);
//         currentLine = null; // Clear the reference
//     }
//     if (polygon) scene.remove(polygon);
//     if (measurementLabel) scene.remove(measurementLabel);
//     dots.forEach(dot => scene.remove(dot));
//     dots = [];
//     measurement = 0;
//     hasActiveMeasurement = false;
//     hasAreaMeasurement = false;
//     isMeasuring = false;
//     enableMeasurement = false;
//     enableAreaMeasurement = false;

//     // Clear sidebar
//     const sidebar = document.getElementById('newMeasurementSidebar');
//     sidebar.innerHTML = ''; // Clear all measurement details
//     sidebar.classList.add('d-none');
// }

// // Function to fetch and display saved measurements
// export function fetchAndDisplaySavedMeasurements() {
//     const savedMeasurementsContent = document.getElementById('savedMeasurementsContent');
//     savedMeasurementsContent.innerHTML = ''; // Clear existing measurements

//     fetch('/measurements')
//         .then(response => response.json())
//         .then(data => {
//             data.forEach(measurement => {
//                 console.log("measurement", measurement);
//                 displaySavedMeasurement(measurement);
//                 addSavedMeasurementToSidebar(measurement);
//             });
//         })
//         .catch(error => console.error('Error fetching measurements:', error));
// }

// // Function to display a saved measurement
// function displaySavedMeasurement(measurement) {
//     const start = new THREE.Vector3(measurement.point1_x, measurement.point1_y, measurement.point1_z);
//     const end = new THREE.Vector3(measurement.point2_x, measurement.point2_y, measurement.point2_z);

//     // Draw line with a cylinder geometry for better selection
//     const material = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue color for saved measurements
//     const direction = new THREE.Vector3().subVectors(end, start);
//     const length = direction.length();
//     const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

//     // Create a cylinder geometry to represent the line
//     const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8); // Adjust the radius as needed
//     const line = new THREE.Mesh(geometry, material);
//     line.position.copy(midPoint);
    
//     // Set the rotation of the line to point from start to end
//     line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

//     line.userData.type = "measurementLine"; // Set user data for identification
//     scene.add(line);
//     objectsToIntersect.push(line); // Add the line to objectsToIntersect

//     // Create measurement data to pass to the dots
//     const measurementData = { line: line, otherDot: null }; // Initialize measurement data

//     // Add dot markers with measurement data
//     const startDot = addDot(start, 0x0000ff, false, measurementData); // Blue dot
//     const endDot = addDot(end, 0x0000ff, false, measurementData); // Blue dot

//     // Update the measurement data to include references to the dots
//     line.userData.startDot = startDot; // Reference to the start dot
//     line.userData.endDot = endDot; // Reference to the end dot

//     // Update the measurement data in the dots
//     startDot.userData.measurementData = { line: line, otherDot: endDot }; // Store line and other dot in start dot
//     endDot.userData.measurementData = { line: line, otherDot: startDot }; // Store line and other dot in end dot

//     objectsToIntersect.push(startDot); // Add the start dot to objectsToIntersect
//     objectsToIntersect.push(endDot); // Add the end dot to objectsToIntersect
// }

// // Function to add saved measurement details to the sidebar
// function addSavedMeasurementToSidebar(measurement) {
//     const savedMeasurementsContent = document.getElementById('savedMeasurementsContent');

//     const measurementContainer = document.createElement('div');
//     measurementContainer.className = 'measurementText';

//     // Alternate background color based on the current index
//     const backgroundColor = measurementIndex % 2 === 0 ? '#f0f0f0' : '#ffffff'; // Light gray and white
//     measurementContainer.style.backgroundColor = backgroundColor;
//     measurementContainer.style.width = '100%';
//     measurementContainer.style.padding = '5px';
//     measurementContainer.style.fontFamily = 'Arial, sans-serif';
//     measurementContainer.style.fontSize = '10px';
//     measurementContainer.innerHTML = `
//         <p class="mb-1">Name: ${measurement.name}</p>
//         <p class="mb-1">Distance: ${measurement.distance.toFixed(2)} metres</p>
//     `;

//     savedMeasurementsContent.appendChild(measurementContainer);

//     measurementIndex++; // Increment the counter after each call
// }
