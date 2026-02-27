<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ReplaceSupplierWithKeteranganOnBarangsTable extends Migration
{
    public function up()
    {
        Schema::table('barangs', function (Blueprint $table) {

            $table->dropColumn('supplier');

            $table->string('keterangan')->default('Siap Pakai');

        });
    }

    public function down()
    {
        Schema::table('barangs', function (Blueprint $table) {

            $table->dropColumn('keterangan');

            $table->string('supplier')->nullable();

        });
    }
}