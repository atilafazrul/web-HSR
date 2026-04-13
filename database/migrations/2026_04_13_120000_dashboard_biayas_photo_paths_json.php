<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dashboard_biayas', function (Blueprint $table) {
            $table->json('photo_paths')->nullable()->after('keterangan');
        });

        $rows = DB::table('dashboard_biayas')->whereNotNull('photo_path')->get();
        foreach ($rows as $row) {
            DB::table('dashboard_biayas')->where('id', $row->id)->update([
                'photo_paths' => json_encode([$row->photo_path]),
            ]);
        }

        Schema::table('dashboard_biayas', function (Blueprint $table) {
            $table->dropColumn('photo_path');
        });
    }

    public function down(): void
    {
        Schema::table('dashboard_biayas', function (Blueprint $table) {
            $table->string('photo_path', 500)->nullable()->after('keterangan');
        });

        $rows = DB::table('dashboard_biayas')->whereNotNull('photo_paths')->get();
        foreach ($rows as $row) {
            $arr = json_decode($row->photo_paths, true);
            $first = is_array($arr) && count($arr) > 0 ? $arr[0] : null;
            DB::table('dashboard_biayas')->where('id', $row->id)->update([
                'photo_path' => $first,
            ]);
        }

        Schema::table('dashboard_biayas', function (Blueprint $table) {
            $table->dropColumn('photo_paths');
        });
    }
};
