<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes; 


class Measurement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'point1_x',
        'point1_y',
        'point1_z',
        'point2_x',
        'point2_y',
        'point2_z',
        'distance',
        'name'
    ];
}