<?php

namespace App\Console\Commands;

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Console\Command;

/**
 * Réinjecte les données de référence de Cyberpunk RED depuis database/data/cpr/*.php, après une correction d'un fichier : met à jour les
 * lignes par leur id fixe, ajoute les nouvelles, ne supprime rien (des fiches peuvent les citer). Relançable sans risque.
 */
class CprReference extends Command
{
    protected $signature = 'cpr:reference
        {tables?* : les tables à traiter (cpr_cyber…), toutes par défaut}
        {--dry-run : compter ce qui changerait, sans rien écrire}';

    protected $description = 'Réinjecte les données de référence de Cyberpunk RED (par id fixe, sans rien supprimer)';

    public function handle(CprReferenceCatalogue $catalogue): int
    {
        $tables = $this->argument('tables');
        $inconnues = array_diff($tables, array_keys(CprReferenceCatalogue::TABLES));
        if ($inconnues) {
            $this->error('Tables inconnues : ' . implode(', ', $inconnues) . '.');

            return self::FAILURE;
        }

        $simulation = (bool) $this->option('dry-run');
        $bilan = $catalogue->synchroniser($tables, $simulation);

        $this->table(
            ['Table', $simulation ? 'À ajouter' : 'Ajoutées', $simulation ? 'À modifier' : 'Modifiées', 'Inchangées', 'Hors du fichier'],
            array_map(fn ($table, $ligne) => [
                $table, $ligne['ajoutees'], $ligne['modifiees'], $ligne['inchangees'], implode(', ', $ligne['absentes_du_fichier']) ?: '—',
            ], array_keys($bilan), $bilan),
        );
        if (array_filter(array_column($bilan, 'absentes_du_fichier'))) {
            $this->warn('Des lignes du livre ne sont plus dans leur fichier : elles restent en base, à retirer à la main si aucune fiche ne les cite.');
        }
        $this->info($simulation ? 'Simulation : rien n\'a été écrit.' : 'Données de référence à jour.');

        return self::SUCCESS;
    }
}
