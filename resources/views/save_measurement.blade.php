<!-- Save Measurement Modal -->
<div class="modal fade" id="saveMeasurementModal" tabindex="-1" aria-labelledby="saveMeasurementModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="saveMeasurementModalLabel">Save Measurement</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="saveMeasurementForm" method="POST" action="{{ route('measurements.store') }}">
                    @csrf

                    <div class="input-group mb-3">
                        <span class="input-group-text">Point 1</span>
                        <input type="number" class="form-control" id="point1_x" name="point1_x" readonly>
                        <input type="number" class="form-control" id="point1_y" name="point1_y" readonly>
                        <input type="number" class="form-control" id="point1_z" name="point1_z" readonly>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">Point 2</span>
                        <input type="number" class="form-control" id="point2_x" name="point2_x" readonly>
                        <input type="number" class="form-control" id="point2_y" name="point2_y" readonly>
                        <input type="number" class="form-control" id="point2_z" name="point2_z" readonly>
                    </div>   
                    
                    <div class="input-group mb-3">
                        <span class="input-group-text">Distance</span>
                        <input type="number" class="form-control" id="distance" name="distance" readonly>
                    </div>

                    <div class="input-group mb-3">
                        <span class="input-group-text">Reference/Name</span>
                        <input type="text" class="form-control" id="measurementName" name="measurementName" required>
                    </div>

                    <button type="submit" class="btn btn-primary">Save Measurement</button>
                </form>
            </div>
        </div>
    </div>
</div>