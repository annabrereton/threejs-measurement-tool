<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('measurements', function (Blueprint $table) {
            // Remove the redundant columns
            $table->dropColumn(['point1_x', 'point1_y', 'point1_z', 'point2_x', 'point2_y', 'point2_z', 'distance']);
        });
    }

    public function down()
    {
        Schema::table('measurements', function (Blueprint $table) {
            // Re-add the columns in case of rollback
            $table->float('point1_x')->nullable();
            $table->float('point1_y')->nullable();
            $table->float('point1_z')->nullable();
            $table->float('point2_x')->nullable();
            $table->float('point2_y')->nullable();
            $table->float('point2_z')->nullable();
            $table->float('distance')->nullable();
        });
    }
};
