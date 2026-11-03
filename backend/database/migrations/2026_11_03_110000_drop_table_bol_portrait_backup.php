<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Les originaux des portraits sortis des fiches ne sont plus gardés de côté : l'extraction est faite sur les postes, et la production
 * partira de zéro. `bol:extract-portraits` n'a plus d'options `--restore` ni `--forget-originals`. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('bol_portrait_backup');
    }

    /** La table revient vide : les originaux effacés ne reviennent pas. */
    public function down(): void
    {
        Schema::create('bol_portrait_backup', function (Blueprint $table) {
            $table->id();
            $table->string('owner_table', 32);
            $table->string('owner_id', 64);
            $table->longText('avatar');
            $table->unique(['owner_table', 'owner_id']);
        });
    }
};
