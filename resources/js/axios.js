import axios from 'axios';

// Set up CSRF token for all requests
axios.defaults.headers.common['X-CSRF-TOKEN'] = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

export function saveMeasurementRequest(formData) {
    return axios.post('/api/measurements', formData);
}

export function updateMeasurementRequest(measurementId, formData) {
    return axios.put(`/measurements/${measurementId}`, formData);
}

export function deleteMeasurementRequest(measurementId) {
    return axios.delete(`/api/measurements/${measurementId}`);
}