<?php

namespace App\Console\Commands;

use App\Http\Services\Bol\BolPortraits;
use Illuminate\Console\Command;

/** Retire les fichiers de portraits qu'aucune fiche ne porte plus : celle-ci a changé de portrait, ou elle a disparu. Relançable sans risque. */
class BolPrunePortraits extends Command
{
    protected $signature = 'bol:prune-portraits
        {--dry-run : compter, sans rien effacer}';

    protected $description = 'Efface les fichiers de portraits qu\'aucune fiche ne porte plus';

    public function handle(): int
    {
        $orphans = BolPortraits::orphans();
        $bytes = array_sum(array_column($orphans, 'size'));

        if ($this->option('dry-run')) {
            $this->info(sprintf('%d portraits à effacer, soit %.1f Mo.', count($orphans), $bytes / 1_000_000));

            return self::SUCCESS;
        }

        foreach ($orphans as $orphan) {
            BolPortraits::delete($orphan['path']);
        }
        $this->info(sprintf('%d portraits effacés, soit %.1f Mo.', count($orphans), $bytes / 1_000_000));

        return self::SUCCESS;
    }
}
