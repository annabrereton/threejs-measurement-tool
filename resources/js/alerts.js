window.dismissAlertsInOrder = function(alerts, delay) {
    const alertsWrapper = document.getElementById('alerts-wrapper');
    alerts.forEach(function (element, index) {
        if (!alertsWrapper.contains(element)) {
            alertsWrapper.appendChild(element); // Add alerts to the alerts wrapper if not already there
        }

        setTimeout(function () {
            element.style.display = 'none'; // Remove alert from view
            element.remove(); // Remove the alert from the DOM
        }, delay + (delay * index));
    });
};

// Initialize dismissal for existing alerts
document.addEventListener('DOMContentLoaded', function() {
    const existingAlerts = document.querySelectorAll('.auto-dismiss');
    if (existingAlerts.length > 0) {
        window.dismissAlertsInOrder(existingAlerts, 3000);
    }
});

export function showMessage(message, type = 'success') {
    const alertsWrapper = document.getElementById('alerts-wrapper');
    
    // Create the alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible auto-dismiss fade show m-0`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert the alert at the top of the alerts-wrapper
    alertsWrapper.insertBefore(alertDiv, alertsWrapper.firstChild);

    // Trigger the dismissal logic
    window.dismissAlertsInOrder([alertDiv], 3000);
}