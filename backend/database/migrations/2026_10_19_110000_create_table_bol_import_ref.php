<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ce qu'un import de scénario a créé (`bol:import-scenario`) : pour une saga, la clé du fichier d'import et
 * l'entité qu'elle désigne. Un réimport met à jour ces entités au lieu d'en créer de nouvelles, et un
 * chapitre peut reprendre un personnage défini par un autre.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_import_ref', function (Blueprint $table) {
            $table->id();
            $table->uuid('user_id');
            $table->string('saga', 60);
            // `scenario`, `scene` ou `personnage`.
            $table->string('type', 20);
            $table->string('cle', 120);
            // `scenario`, `scene`, `pnj`, `creature` ou `demon`.
            $table->string('entity_kind', 20);
            $table->string('entity_id', 36);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['user_id', 'saga', 'type', 'cle']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_import_ref');
    }
};
