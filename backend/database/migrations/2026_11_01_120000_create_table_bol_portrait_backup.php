<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Les portraits en base64 sortis des fiches par `bol:extract-portraits` : ils restent ici, à part, jusqu'à ce qu'on les oublie. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_portrait_backup', function (Blueprint $table) {
            $table->id();
            $table->string('owner_table', 32);
            $table->string('owner_id', 64);
            $table->longText('avatar');
            $table->unique(['owner_table', 'owner_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_portrait_backup');
    }
};
