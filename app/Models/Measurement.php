<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; 


class Measurement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'total_distance',
    ];

    // Define the relationship with the Point model
    public function points()
    {
        return $this->hasMany(Point::class);
    }
}