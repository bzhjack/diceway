<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_region', function (Blueprint $table) {
            $table->foreignId('langue_native_id')->nullable()->after('description')->constrained('bol_langue')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bol_region', function (Blueprint $table) {
            $table->dropForeign(['langue_native_id']);
            $table->dropColumn('langue_native_id');
        });
    }
};
