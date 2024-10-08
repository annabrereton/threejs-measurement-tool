<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Point extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'measurement_id',
        'x',
        'y',
        'z',
    ];

    // Define the relationship with the Measurement model
    public function measurement()
    {
        return $this->belongsTo(Measurement::class);
    }
}