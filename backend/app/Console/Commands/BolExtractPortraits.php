<?php

namespace App\Console\Commands;

use App\Http\Services\Bol\BolCache;
use App\Http\Services\Bol\BolPortraits;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Sort des fiches les portraits en base64 : chacun devient un fichier, et la fiche n'en garde que l'adresse. À lancer une fois sur
 * chaque machine, relançable sans risque.
 */
class BolExtractPortraits extends Command
{
    protected $signature = 'bol:extract-portraits
        {--dry-run : compter, sans rien écrire}';

    protected $description = 'Transforme les portraits en base64 des fiches en fichiers servis par une simple adresse';

    public function handle(): int
    {
        $result = $this->extract((bool) $this->option('dry-run'));
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
                            DB::table($table)->where('id', $row->id)->update(['avatar' => $url]);
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

    /** Les listes en cache portent encore les anciens portraits. */
    private function forgetCachedLists(): void
    {
        foreach (User::query()->pluck('id') as $userId) {
            Cache::forget(BolCache::creatures($userId));
            Cache::forget(BolCache::demons($userId));
        }
    }
}
