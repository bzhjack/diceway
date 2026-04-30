<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_langue', function (Blueprint $table) {
            $table->boolean('est_lemurienne')->default(false)->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('bol_langue', function (Blueprint $table) {
            $table->dropColumn('est_lemurienne');
        });
    }
};
