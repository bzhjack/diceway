<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_arme', function (Blueprint $table) {
            $table->foreignUuid('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
        });

        Schema::table('bol_armure', function (Blueprint $table) {
            $table->foreignUuid('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bol_arme', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });

        Schema::table('bol_armure', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
