<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('service_report_parts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_report_id')->constrained()->onDelete('cascade');
            $table->string('part_name')->nullable();
            $table->string('part_no')->nullable();
            $table->string('in')->nullable();
            $table->string('out')->nullable();
            $table->integer('qty')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_report_parts');
    }
};
