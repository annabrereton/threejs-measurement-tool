<?php

namespace App\Http\Controllers;

use App\Models\Measurement;
use Illuminate\Http\Request;

class MeasurementController extends Controller
{
    // Display a listing of the measurements
    public function index()
    {
        $measurements = Measurement::with('points')->get();
        return response()->json($measurements);
    }

    // Store a newly created measurement in storage
    public function store(Request $request)
    {
        // dd($request->all());
        $request->validate([
            'name' => 'required|string|max:255',
            'total_distance' => 'required|numeric',
            'points' => 'required|array', // Expecting an array of points
            'points.*.x' => 'required|numeric',
            'points.*.y' => 'required|numeric',
            'points.*.z' => 'required|numeric',
        ]);
    
        // Create the measurement
        $measurement = Measurement::create([
            'name' => $request->input('name'),
            'total_distance' => $request->input('total_distance'),
        ]);
    
        // Save the points
        foreach ($request->input('points') as $point) {
            // \Log::info('Saving point:', $point); // Log the point data
            try {
                $measurement->points()->create($point);
            } catch (\Exception $e) {
                \Log::error('Error saving point: ' . $e->getMessage());
            }
        }
    
        return response()->json($measurement->load('points'), 201); // Return the measurement with points
    }

    // Method to delete a measurement
    public function destroy($id)
    {
        // Find the measurement by ID
        $measurement = Measurement::find($id);

        // Check if the measurement exists
        if (!$measurement) {
            return response()->json(['message' => 'Measurement not found'], 404);
        }

        // Delete the measurement
        $measurement->delete();

        // Return a success response
        return response()->json(['message' => 'Measurement deleted successfully'], 200);
    }
}