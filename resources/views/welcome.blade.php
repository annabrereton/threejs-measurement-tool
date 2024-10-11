<!DOCTYPE html>
<html lang="en">
<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Measurement Tool</title>

    <!-- <link rel="stylesheet" href="resources/css/styles.css"> -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
    integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <!-- <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz"
      crossorigin="anonymous"></script> -->

      @vite('resources/js/app.js')
      @vite('resources/css/app.css')
      @vite('resources/js/alerts.js')

</head>

<body>

@include('save_measurement')
@include('edit_measurement')

    <div id="alerts-wrapper">

        @if ($errors->any())
        <div class="alert alert-danger alert-dismissible auto-dismiss fade show">
            <ul class="m-0">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        @endif

        @if (session('status'))
            <div class="alert alert-success alert-dismissible auto-dismiss fade show m-0">
                {{ __(session('status')) }}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        @endif

        @if (session('success'))
            <div class="alert alert-success alert-dismissible auto-dismiss fade show m-0">
                {{ __(session('success')) }}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        @endif
    </div>

    <h1>Measurement Tool</h1>
    
    <!-- Add Panel Buttons -->
    <div class="add-panel-buttons">
        <h5 class="text-white">Add Panel</h5>
        <button id="addPanel1" class="btn btn-primary">Type 1</button>
        <button id="addPanel2" class="btn btn-primary">Type 2</button>
    </div>

    <!-- Sidebar -->
    <div id="newMeasurementSidebar" class="sidebar d-none"></div>
    
    <!-- Sidebar for Saved Measurements -->
    <div id="savedMeasurementsSidebar" class="sidebar d-flex flex-column align-items-start">
        <div class="mb-2 d-flex justify-content-between align-items-center w-100">
            <h6 class="m-0">Saved Measurements</h6>
            <button id="toggleSidebar" class="btn btn-sm btn-light">-</button>
        </div>
        <div id="savedMeasurementsContent">
            <!-- Saved measurements will be appended here -->
        </div>
    </div>

    <!-- Context Menu -->
    <div id="contextMenu" style="display: none; position: absolute; background: white; border: 1px solid #ccc; z-index: 1000;">
        <!-- <ul style="list-style: none; padding: 10px; border: 1px solid #ccc; margin: 0;">
            <li id="deleteMeasurement" style="cursor: pointer;">Delete</li>
        </ul> -->
    </div>


     <!-- <script>

        window.alerts = document.querySelectorAll('.auto-dismiss');
        window.alertsWrapper = document.getElementById('alerts-wrapper');

        // Function to dismiss each alert in order with a delay
        function dismissAlertsInOrder(alerts, delay) {
            alerts.forEach(function (element, index) {
                alertsWrapper.appendChild(element); // Add alerts to the alerts wrapper

                setTimeout(function () {
                    element.style.display = 'none'; // Remove alert from view
                }, delay + (delay * index)); // Remove first alert by the delay and subsequent alerts by the delay * index
            });
        }

        // Call the function to dismiss alerts in sequence
        dismissAlertsInOrder(alerts, 3000); // 5 seconds delay between dismissals

    </script> -->


</body>

</html>