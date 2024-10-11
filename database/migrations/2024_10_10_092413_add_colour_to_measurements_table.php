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
            $table->string('colour')->default('#0000ff')->after('total_distance');
        });
    }
    
    public function down()
    {
        Schema::table('measurements', function (Blueprint $table) {
            $table->dropColumn('colour');
        });
    }
};
