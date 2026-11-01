<?php

namespace App\Console\Commands;

use App\Http\Services\Bol\BolCache;
use App\Http\Services\Bol\BolPortraits;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Sort des fiches les portraits en base64 : chacun devient un fichier, et la fiche n'en garde que l'adresse. L'original reste dans
 * `bol_portrait_backup` jusqu'à `--forget-originals` ; `--restore` le remet. À lancer une fois sur chaque machine, relançable sans risque.
 */
class BolExtractPortraits extends Command
{
    protected $signature = 'bol:extract-portraits
        {--dry-run : compter, sans rien écrire}
        {--restore : remettre les originaux, sauf sur les fiches dont le portrait a changé depuis}
        {--forget-originals : effacer les originaux gardés de côté}';

    protected $description = 'Transforme les portraits en base64 des fiches en fichiers servis par une simple adresse';

    public function handle(): int
    {
        if ($this->option('forget-originals')) {
            return $this->forgetOriginals();
        }
        $result = $this->option('restore') ? $this->restore() : $this->extract((bool) $this->option('dry-run'));
        if (! $this->option('dry-run')) {
            $this->forgetCachedLists();
        }

        return $result;
    }

    private function extract(bool $dryRun): int
    {
        $moved = 0;
        $bytes = 0;
        $failed = [];

        foreach (BolPortraits::TABLES as $table) {
            DB::table($table)
                ->where('avatar', 'like', 'data:image/%')
                ->select('id', 'avatar')
                ->orderBy('id')
                ->chunkById(25, function ($rows) use ($table, $dryRun, &$moved, &$bytes, &$failed) {
                    foreach ($rows as $row) {
                        $url = $dryRun ? BolPortraits::urlOf($row->avatar) : BolPortraits::store($row->avatar);
                        if ($url === null) {
                            $failed[] = "{$table} {$row->id}";
                            continue;
                        }
                        if (! $dryRun) {
                            $this->replaceWithFile($table, $row->id, $row->avatar, $url);
                        }
                        $moved++;
                        $bytes += strlen($row->avatar);
                    }
                });
        }

        $verb = $dryRun ? 'à sortir' : 'sortis';
        $this->info(sprintf('%d portraits %s, soit %.1f Mo de moins dans les réponses.', $moved, $verb, $bytes / 1_000_000));
        foreach ($failed as $row) {
            $this->warn("Illisible, laissé tel quel : {$row}");
        }

        return self::SUCCESS;
    }

    private function replaceWithFile(string $table, string $id, string $original, string $url): void
    {
        DB::transaction(function () use ($table, $id, $original, $url) {
            DB::table('bol_portrait_backup')->updateOrInsert(['owner_table' => $table, 'owner_id' => $id], ['avatar' => $original]);
            DB::table($table)->where('id', $id)->update(['avatar' => $url]);
        });
    }

    private function restore(): int
    {
        $restored = 0;
        $changed = 0;

        DB::table('bol_portrait_backup')->orderBy('id')->chunkById(25, function ($rows) use (&$restored, &$changed) {
            foreach ($rows as $row) {
                $current = DB::table($row->owner_table)->where('id', $row->owner_id)->value('avatar');
                if ($current === BolPortraits::urlOf($row->avatar)) {
                    DB::transaction(function () use ($row) {
                        DB::table($row->owner_table)->where('id', $row->owner_id)->update(['avatar' => $row->avatar]);
                        DB::table('bol_portrait_backup')->where('id', $row->id)->delete();
                    });
                    $restored++;
                } else {
                    $changed++;
                }
            }
        });

        $this->info("{$restored} portraits remis, {$changed} laissés : leur fiche a changé depuis.");

        return self::SUCCESS;
    }

    private function forgetOriginals(): int
    {
        $count = DB::table('bol_portrait_backup')->count();
        if (! $this->confirm("Effacer {$count} originaux ? Le retour en arrière ne sera plus possible.")) {
            return self::FAILURE;
        }
        DB::table('bol_portrait_backup')->delete();
        $this->info("{$count} originaux effacés.");

        return self::SUCCESS;
    }

    /** Les listes en cache portent encore les anciens portraits. */
    private function forgetCachedLists(): void
    {
        foreach (User::query()->pluck('id') as $userId) {
            Cache::forget(BolCache::creatures($userId));
            Cache::forget(BolCache::demons($userId));
        }
    }
}
