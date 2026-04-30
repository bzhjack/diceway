<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_region', function (Blueprint $table) {
            $table->foreignId('premiere_carriere_id')->nullable()->after('langue_native_id')->constrained('bol_carriere')->nullOnDelete();
            $table->json('carrieres_requises')->nullable()->after('premiere_carriere_id');
            $table->json('carrieres_interdites')->nullable()->after('carrieres_requises');
        });
    }

    public function down(): void
    {
        Schema::table('bol_region', function (Blueprint $table) {
            $table->dropForeign(['premiere_carriere_id']);
            $table->dropColumn(['premiere_carriere_id', 'carrieres_requises', 'carrieres_interdites']);
        });
    }
};
