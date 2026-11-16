<?php

namespace App\Console\Commands;

use App\Http\Services\Bol\BolPortraits;
use App\Models\Bol\BolImportRef;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/**
 * Sort les portraits des fiches qu'un compte a importées avec ses scénarios, chacun nommé `<saga>--<clé>.<ext>` : le nom que
 * `bol:import-portraits` attend. Sert à reporter les portraits d'un poste sur un autre, où les mêmes scénarios ont été importés (les
 * clés d'import y sont les mêmes, les ids non). Les fiches créées à la main n'ont pas de clé : elles sont seulement nommées, à reprendre
 * dans l'app.
 */
class BolExportPortraits extends Command
{
    protected $signature = 'bol:export-portraits
        {dossier : dossier où écrire les images (créé s’il manque)}
        {--user= : e-mail du compte}';

    protected $description = "Sort les portraits des fiches importées d'un compte, nommés <saga>--<clé> pour bol:import-portraits";

    private const TABLES = ['pnj' => 'bol_heros', 'creature' => 'bol_creature', 'demon' => 'bol_demon'];

    public function handle(): int
    {
        $user = User::where('email', (string) $this->option('user'))->first();
        if (! $user) {
            $this->error('--user : il faut l’e-mail du compte.');

            return self::FAILURE;
        }
        $dir = rtrim((string) $this->argument('dossier'), '/');
        File::ensureDirectoryExists($dir);

        $written = 0;
        $exported = [];
        $notFiles = [];
        $refs = BolImportRef::where('user_id', $user->id)
            ->where('type', BolImportRef::TYPE_PERSONNAGE)
            ->orderBy('saga')
            ->orderBy('cle')
            ->get();

        foreach ($refs as $ref) {
            $table = self::TABLES[$ref->entity_kind] ?? null;
            $sheet = $table ? DB::table($table)->where('id', $ref->entity_id)->where('user_id', $user->id)->first(['id', 'avatar']) : null;
            if (! $sheet || empty($sheet->avatar)) {
                continue;
            }
            $exported[$table . ':' . $sheet->id] = true;
            $file = str_starts_with($sheet->avatar, BolPortraits::ROUTE) ? BolPortraits::locate(basename($sheet->avatar)) : null;
            if ($file === null) {
                $notFiles[] = "{$ref->saga}--{$ref->cle}";
                continue;
            }
            File::copy($file['path'], $dir . '/' . $ref->saga . '--' . $ref->cle . '.' . pathinfo($file['path'], PATHINFO_EXTENSION));
            $written++;
        }

        $this->info("$written portraits écrits dans $dir.");
        if ($notFiles !== []) {
            $this->warn(count($notFiles) . ' portraits ne sont pas des fichiers (image du livre, ancien base64 : `bol:extract-portraits` d’abord) : '
                . implode(', ', $notFiles));
        }
        $sansCle = $this->sansCle((string) $user->id, $exported);
        if ($sansCle !== []) {
            $this->line(count($sansCle) . ' fiches créées à la main ont un portrait, sans clé pour le retrouver ailleurs (à reposer dans l’app) : '
                . implode(', ', $sansCle));
        }

        return self::SUCCESS;
    }

    /**
     * Les fiches du compte qui ont un portrait mais aucune clé d'import : leurs noms.
     *
     * @param array<string, true> $exported
     * @return list<string>
     */
    private function sansCle(string $userId, array $exported): array
    {
        $noms = [];
        foreach (array_unique(self::TABLES) as $table) {
            $fiches = DB::table($table)->where('user_id', $userId)->whereNotNull('avatar')->where('avatar', '!=', '')->get(['id', 'nom']);
            foreach ($fiches as $fiche) {
                if (! isset($exported[$table . ':' . $fiche->id])) {
                    $noms[] = $fiche->nom;
                }
            }
        }
        sort($noms);

        return $noms;
    }
}
