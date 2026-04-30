<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_carriere', function (Blueprint $table) {
            $table->boolean('donne_langue')->default(false)->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('bol_carriere', function (Blueprint $table) {
            $table->dropColumn('donne_langue');
        });
    }
};
