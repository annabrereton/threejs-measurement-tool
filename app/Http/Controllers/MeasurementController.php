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
            'colour' => 'required|string|max:7',
        ]);
    
        // Create the measurement
        $measurement = Measurement::create([
            'name' => $request->input('name'),
            'total_distance' => $request->input('total_distance'),
            'colour' => $request->input('colour'),
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
    
        return response()->json([
            'success' => true,
            'message' => 'Measurement saved successfully',
            'measurement' => $measurement
        ]);
        // return response()->json($measurement->load('points'), 201); // Return the measurement with points
    }

    public function update(Request $request, Measurement $measurement)
    {
        $validatedData = $request->validate([
            'edit_name' => 'required|string|max:255',
            'edit_colour' => 'required|string|max:7',
        ]);

        $measurement->update([
            'name' => $validatedData['edit_name'],
            'colour' => $validatedData['edit_colour'],
        ]);
        
        return redirect()->back()->with('success', 'Measurement updated successfully');
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
        // return response()->json([
        //     'success' => true,
        //     'message' => 'Measurement deleted successfully'
        // ]);
        return response()->json(['message' => 'Measurement deleted successfully'], 200);
    }
}