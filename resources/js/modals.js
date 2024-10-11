import * as bootstrap from 'bootstrap';
import { saveMeasurementRequest, updateMeasurementRequest, deleteMeasurementRequest } from './axios.js';
import { clearMeasurement, fetchAndDisplaySavedMeasurements } from './measurements.js';
import { showMessage } from './alerts.js';

// Function to open the saveMeasurementModal
export function openSaveModal(currentMeasurement) {
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
        event.preventDefault();
        handleSaveMeasurement(event, currentMeasurement);
    };
}

// export function saveMeasurement(currentMeasurement) {
//     // Create an object to hold the form data
//     const formData = {
//         name: document.getElementById('measurementName').value,
//         total_distance: document.getElementById('total_distance').value,
//         points: currentMeasurement.points.map((point, index) => ({  // Collect points from the modal inputs
//             x: parseFloat(document.getElementById(`point${index + 1}_x`).value),
//             y: parseFloat(document.getElementById(`point${index + 1}_y`).value),
//             z: parseFloat(document.getElementById(`point${index + 1}_z`).value)
//         }))
//     };
//     console.log('Form Data:', formData);

//     // Send the data using Axios
//     axios.post(saveMeasurementForm.action, formData, {
//         headers: {
//             'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
//         }
//     })
//     .then(response => {
//         console.log('Measurement saved:', response.data);
//         const saveMeasurementModal = bootstrap.Modal.getInstance(document.getElementById('saveMeasurementModal'));
//         saveMeasurementModal.hide();
//         removeBackdrop();
//         clearMeasurement();
//         fetchAndDisplaySavedMeasurements();  // Call to update the UI
//         showMessage('Measurement saved successfully');
//     })
//     .catch(error => {
//         console.error('Error saving measurement:', error);
//         showMessage('Error saving measurement', 'error');
//     });
// }


// Open the editMeasurementModal
export function openEditMeasurementModal(measurementGroup) {  
    const modalElement = document.getElementById('editMeasurementModal');
    if (!modalElement) {
        console.error('Modal element not found');
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    console.log("measurementGroup", measurementGroup);
    
     // Populate the form
     document.getElementById('edit_total_distance').value = measurementGroup.userData.totalDistance.toFixed(2);
     console.log("edit_total_distance", document.getElementById('total_distance').value);
     document.getElementById('edit_name').value = measurementGroup.userData.name || '';
     document.getElementById('edit_colour').value = measurementGroup.userData.colour;

     // Set the form action
     const editMeasurementForm = document.getElementById('editMeasurementForm');
     editMeasurementForm.action = `/measurements/${measurementGroup.userData.measurementId}`;

     modal.show();
}

export function handleSaveMeasurement(event, currentMeasurement) {
    event.preventDefault();
    // Create an object to hold the form data
    const formData = {
        name: document.getElementById('measurementName').value,
        total_distance: document.getElementById('total_distance').value,
        points: currentMeasurement.points.map((point, index) => ({
            x: parseFloat(document.getElementById(`point${index + 1}_x`).value),
            y: parseFloat(document.getElementById(`point${index + 1}_y`).value),
            z: parseFloat(document.getElementById(`point${index + 1}_z`).value),
        })),
        colour: document.getElementById('colour').value,
    };    
    console.log('Form Data:', formData);
    
    saveMeasurementRequest(formData)
        .then(response => {
            console.log('Measurement saved:', response.data);
            closeSaveModal();
            removeBackdrop();
            clearMeasurement();
            fetchAndDisplaySavedMeasurements();
            showMessage('Measurement saved successfully');
        })
        .catch(error => {
            console.error('Error saving measurement:', error);
            showMessage('Error saving measurement', 'error');
        });
}

export function handleEditMeasurement(event, measurementId) {
    event.preventDefault();
    const formData = getFormData('editMeasurementForm');
    updateMeasurement(measurementId, formData);
    closeEditModal();
}

function getFormData(formId) {
    const form = document.getElementById(formId);
    return new FormData(form);
}

function closeSaveModal() {
    const saveMeasurementModal = bootstrap.Modal.getInstance(document.getElementById('saveMeasurementModal'));
    if (saveMeasurementModal) {
        saveMeasurementModal.hide();
    }
    // removeBackdrop();
}

function closeEditModal() {
    const editMeasurementModal = bootstrap.Modal.getInstance(document.getElementById('editMeasurementModal'));
    if (editMeasurementModal) {
        editMeasurementModal.hide();
    }
    // removeBackdrop();
}

export function removeBackdrop() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    if (backdrops) {
       backdrops.forEach(backdrop => backdrop.remove());
    }
  }