<?php

namespace App\Http\Controllers;

use App\Models\Measurement;
use Illuminate\Http\Request;

class MeasurementController extends Controller
{
    // Display a listing of the measurements
    public function index()
    {
        $measurements = Measurement::all();
        return response()->json($measurements);
    }

    // Store a newly created measurement in storage
    public function store(Request $request)
    {
        $request->validate([
            'point1_x' => 'required|numeric',
            'point1_y' => 'required|numeric',
            'point1_z' => 'required|numeric',
            'point2_x' => 'required|numeric',
            'point2_y' => 'required|numeric',
            'point2_z' => 'required|numeric',
            'distance' => 'required|numeric',
            'name' => 'required|string|max:255'
        ]);

        $measurement = Measurement::create([
            'point1_x' => $request->input('point1_x'),
            'point1_y' => $request->input('point1_y'),
            'point1_z' => $request->input('point1_z'),
            'point2_x' => $request->input('point2_x'),
            'point2_y' => $request->input('point2_y'),
            'point2_z' => $request->input('point2_z'),
            'distance' => $request->input('distance'),
            'name' => $request->input('name')
        ]);

        return response()->json($measurement, 201);
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