<?php

use App\Http\Services\Bol\BolTitreChapitre;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Le scénario devient une fiche (`bol_saga`) : jusqu'ici, ce n'était que le début du titre de ses chapitres (« Perle du Beshaar — 1.
 * Sacrilège à Satarla »). Chaque chapitre le désigne (`saga_id`, null pour un one shot) et porte son numéro (`numero`, 0 pour
 * l'introduction) ; son titre ne garde que son nom. Les scénarios se retrouvent par leur nom, sans la casse, parmi ceux du même compte.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_saga', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('titre');
            $table->text('pitch')->nullable();
            $table->string('image')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'titre']);
        });

        Schema::table('bol_scenario', function (Blueprint $table) {
            $table->uuid('saga_id')->nullable()->after('user_id');
            $table->unsignedSmallInteger('numero')->nullable()->after('saga_id');

            $table->foreign('saga_id')->references('id')->on('bol_saga')->nullOnDelete();
        });

        $sagas = [];
        foreach (DB::table('bol_scenario')->orderBy('created_at')->get(['id', 'user_id', 'titre']) as $chapitre) {
            ['saga' => $saga, 'numero' => $numero, 'titre' => $titre] = BolTitreChapitre::decouper($chapitre->titre);
            if ($saga === null) {
                continue;
            }
            $cle = $chapitre->user_id . '|' . mb_strtolower($saga);
            $sagas[$cle] ??= $this->creerSaga($chapitre->user_id, $saga);
            DB::table('bol_scenario')->where('id', $chapitre->id)->update(['saga_id' => $sagas[$cle], 'numero' => $numero, 'titre' => $titre]);
        }
    }

    public function down(): void
    {
        $sagas = DB::table('bol_saga')->pluck('titre', 'id');
        foreach (DB::table('bol_scenario')->whereNotNull('saga_id')->get(['id', 'saga_id', 'numero', 'titre']) as $chapitre) {
            $titre = BolTitreChapitre::recomposer($sagas[$chapitre->saga_id] ?? null, $chapitre->numero, $chapitre->titre);
            DB::table('bol_scenario')->where('id', $chapitre->id)->update(['titre' => $titre]);
        }

        Schema::table('bol_scenario', function (Blueprint $table) {
            $table->dropForeign(['saga_id']);
            $table->dropColumn(['saga_id', 'numero']);
        });
        Schema::dropIfExists('bol_saga');
    }

    private function creerSaga(string $userId, string $titre): string
    {
        $id = (string) Str::uuid();
        DB::table('bol_saga')->insert(['id' => $id, 'user_id' => $userId, 'titre' => $titre, 'created_at' => now(), 'updated_at' => now()]);

        return $id;
    }
};
