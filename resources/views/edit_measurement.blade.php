<!-- Edit Measurement Modal -->
<div class="modal fade" id="editMeasurementModal" tabindex="-1" aria-labelledby="editMeasurementModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editMeasurementModalLabel">Edit Measurement</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
            <form id="editMeasurementForm" method="POST" action="{{ route('measurements.update', ['measurement' => ':id']) }}">
                    @csrf
                    @method('PUT')

                    <div class="input-group mb-3">
                        <span class="input-group-text">Distance</span>
                        <input type="number" class="form-control" id="edit_total_distance" name="edit_total_distance" readonly>
                    </div>

                    <div class="input-group mb-3">
                        <span class="input-group-text">Reference/Name</span>
                        <input type="text" class="form-control" id="edit_name" name="edit_name" required>
                    </div>

                    <div class="input-group mb-3">
                        <span class="input-group-text">Colour</span>
                        <input type="color" class="form-control" id="edit_colour" name="edit_colour" required>
                    </div>

                    <button type="submit" class="btn btn-primary">Save Measurement</button>
                </form>
            </div>
        </div>
    </div>
</div>
