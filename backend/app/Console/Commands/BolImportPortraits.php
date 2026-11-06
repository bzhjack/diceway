<?php

namespace App\Console\Commands;

use App\Http\Services\Bol\BolCache;
use App\Http\Services\Bol\BolPortraits;
use App\Models\Bol\BolImportRef;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Pose d'un coup les portraits générés pour une saga (prompts : `doc/bol/scenarios/<saga>/portraits.md`). Chaque image est
 * nommée d'après la clé d'import de sa fiche : `<clé>.png` avec `--saga`, ou `<saga>--<clé>.png`. Une fiche qui a déjà un
 * portrait le garde, sauf avec `--force` ; une clé qui renvoie au catalogue n'est jamais touchée (son image vient de
 * `front/src/assets/bol/`).
 */
class BolImportPortraits extends Command
{
    protected $signature = 'bol:import-portraits
        {dossier : dossier des images (png, jpg, webp ou gif)}
        {--user= : e-mail du compte qui a importé la saga}
        {--saga= : saga des fichiers nommés <clé>.png}
        {--force : remplacer aussi les portraits déjà posés}
        {--dry-run : tout vérifier, sans rien écrire}';

    protected $description = "Pose les portraits d'une saga sur ses fiches, retrouvées par leur clé d'import";

    private const TABLES = ['pnj' => 'bol_heros', 'creature' => 'bol_creature', 'demon' => 'bol_demon'];

    private const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

    public function handle(): int
    {
        $user = User::where('email', (string) $this->option('user'))->first();
        if (! $user) {
            $this->error('--user : il faut l’e-mail du compte qui a importé la saga.');

            return self::FAILURE;
        }
        $dir = rtrim((string) $this->argument('dossier'), '/');
        if (! is_dir($dir)) {
            $this->error("Dossier introuvable : $dir");

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $placed = [];
        $kept = [];
        $catalogue = [];
        $errors = [];

        foreach ($this->images($dir) as $file) {
            $name = basename($file);
            [$saga, $cle] = $this->sagaAndKey(pathinfo($file, PATHINFO_FILENAME));
            if ($saga === null) {
                $errors[] = "$name : saga inconnue (nommer le fichier <saga>--<clé> ou passer --saga)";
                continue;
            }
            $ref = BolImportRef::where('user_id', $user->id)
                ->where('saga', $saga)
                ->where('type', BolImportRef::TYPE_PERSONNAGE)
                ->where('cle', $cle)
                ->first();
            $table = $ref ? (self::TABLES[$ref->entity_kind] ?? null) : null;
            $sheet = $table ? DB::table($table)->where('id', $ref->entity_id)->first(['id', 'user_id', 'avatar']) : null;
            if (! $sheet) {
                $errors[] = "$name : aucune fiche « $cle » dans la saga $saga de ce compte";
                continue;
            }
            if ((string) $sheet->user_id !== (string) $user->id) {
                $catalogue[] = $name;
                continue;
            }
            if (! empty($sheet->avatar) && ! $this->option('force')) {
                $kept[] = $name;
                continue;
            }

            $dataUrl = 'data:image/*;base64,' . base64_encode((string) file_get_contents($file));
            $url = $dryRun ? BolPortraits::urlOf($dataUrl) : BolPortraits::store($dataUrl);
            if ($url === null) {
                $errors[] = "$name : image illisible";
                continue;
            }
            if (! $dryRun) {
                DB::table($table)->where('id', $sheet->id)->update(['avatar' => $url, 'updated_at' => now()]);
            }
            $placed[] = $name;
        }

        if (! $dryRun && $placed !== []) {
            Cache::forget(BolCache::creatures((string) $user->id));
            Cache::forget(BolCache::demons((string) $user->id));
        }

        $this->info(sprintf('%d portraits %s.', count($placed), $dryRun ? 'à poser' : 'posés'));
        if ($kept !== []) {
            $this->line(count($kept) . ' fiches gardent leur portrait (--force pour le remplacer) : ' . implode(', ', $kept));
        }
        if ($catalogue !== []) {
            $this->line(count($catalogue) . ' clés renvoient au catalogue, laissées telles quelles : ' . implode(', ', $catalogue));
        }
        foreach ($errors as $error) {
            $this->warn($error);
        }

        return $errors === [] ? self::SUCCESS : self::FAILURE;
    }

    /** @return list<string> */
    private function images(string $dir): array
    {
        $files = array_filter(
            glob($dir . '/*') ?: [],
            fn (string $file) => is_file($file) && in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), self::EXTENSIONS, true),
        );
        sort($files);

        return array_values($files);
    }

    /** @return array{0: ?string, 1: string} */
    private function sagaAndKey(string $base): array
    {
        if (str_contains($base, '--')) {
            [$saga, $cle] = explode('--', $base, 2);

            return [$saga, $cle];
        }
        $saga = (string) $this->option('saga');

        return [$saga === '' ? null : $saga, $base];
    }
}
