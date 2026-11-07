<?php

namespace App\Http\Services\Cpr;

use App\Models\Cpr;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Les données de référence de Cyberpunk RED, tirées des fichiers `database/data/cpr/<table>.php` (la seule source). Chaque ligne y a un
 * `id` fixe : les images rangées sous cet id (`/assets/cpr/<table>/<id>.webp`) et les fiches qui citent la ligne ne bougent jamais.
 *
 * `synchroniser()` met les tables au niveau des fichiers, ligne par ligne et par id : il met à jour ce qui existe, ajoute ce qui manque,
 * et ne supprime rien (des fiches peuvent citer une ligne) ; il signale les lignes du livre qui ne sont plus dans le fichier. Les migrations
 * l'appellent pour remplir leurs tables ; la commande `cpr:reference` aussi, pour réinjecter après une correction d'un fichier.
 *
 * Les ids du livre restent sous ID_DES_COMPTES : les objets créés par les comptes commencent là, pour qu'une ligne ajoutée plus tard au
 * livre ne tombe jamais sur l'id d'un objet de compte.
 */
class CprReferenceCatalogue
{
    public const ID_DES_COMPTES = 10000;

    /** Les tables, dans l'ordre où elles se remplissent (une table vient après celles qu'elle cite), et le modèle qui dit leurs types. */
    public const TABLES = [
        'cpr_role' => Cpr\CprRole::class,
        'cpr_competence' => Cpr\CprCompetence::class,
        'cpr_role_competence' => Cpr\CprRoleCompetence::class,
        'cpr_role_profil' => Cpr\CprRoleProfil::class,
        'cpr_arme' => Cpr\CprArme::class,
        'cpr_munition' => Cpr\CprMunition::class,
        'cpr_accessoire' => Cpr\CprAccessoire::class,
        'cpr_armure' => Cpr\CprArmure::class,
        'cpr_cyber' => Cpr\CprCyber::class,
        'cpr_equipement' => Cpr\CprEquipement::class,
        'cpr_vetement' => Cpr\CprVetement::class,
        'cpr_drogue' => Cpr\CprDrogue::class,
        'cpr_programme' => Cpr\CprProgramme::class,
        'cpr_materiel_net' => Cpr\CprMaterielNet::class,
        'cpr_vehicule' => Cpr\CprVehicule::class,
        'cpr_amelioration_vehicule' => Cpr\CprAmeliorationVehicule::class,
        'cpr_role_dotation' => Cpr\CprRoleDotation::class,
    ];

    /** Les clés de cache de CprReferenceData à oublier quand une table change. */
    private const CACHE = [
        'cpr_role' => 'cpr_roles_all', 'cpr_competence' => 'cpr_competences_all', 'cpr_role_competence' => 'cpr_roles_all',
        'cpr_role_profil' => 'cpr_roles_all', 'cpr_role_dotation' => 'cpr_roles_all', 'cpr_arme' => 'cpr_armes_catalogue',
        'cpr_munition' => 'cpr_munitions_catalogue', 'cpr_accessoire' => 'cpr_accessoires_catalogue', 'cpr_armure' => 'cpr_armures_catalogue',
        'cpr_cyber' => 'cpr_cyber_catalogue', 'cpr_equipement' => 'cpr_equipement_catalogue', 'cpr_vetement' => 'cpr_vetements_catalogue',
        'cpr_drogue' => 'cpr_drogues_catalogue', 'cpr_programme' => 'cpr_programmes_catalogue', 'cpr_materiel_net' => 'cpr_materiel_net_catalogue',
        'cpr_vehicule' => 'cpr_vehicules_catalogue', 'cpr_amelioration_vehicule' => 'cpr_ameliorations_vehicule_catalogue',
    ];

    /**
     * Met les tables au niveau de leurs fichiers.
     *
     * @param string[] $tables les tables à traiter (toutes par défaut), dans l'ordre de TABLES
     * @return array<string, array{ajoutees: int, modifiees: int, inchangees: int, absentes_du_fichier: int[]}>
     */
    public function synchroniser(array $tables = [], bool $simulation = false): array
    {
        $bilan = [];
        foreach (array_keys(self::TABLES) as $table) {
            if ($tables && !in_array($table, $tables, true)) {
                continue;
            }
            if ($simulation) {
                $bilan[$table] = $this->comparer($table);
                continue;
            }
            $bilan[$table] = DB::transaction(fn () => $this->synchroniserLaTable($table));
            $this->reserverLesIdsDuLivre($table); // hors transaction : sous MySQL, ALTER TABLE la validerait
            $this->oublierLeCache([$table]);
        }
        return $bilan;
    }

    /** @param string[] $tables */
    public function oublierLeCache(array $tables): void
    {
        foreach (array_unique(array_map(fn ($table) => self::CACHE[$table], $tables)) as $cle) {
            Cache::forget($cle);
        }
    }

    /** Les lignes du fichier d'une table, sous la forme de la base (colonnes JSON encodées), réduites aux colonnes qui existent. */
    public function lignes(string $table): array
    {
        $fichier = database_path("data/cpr/{$table}.php");
        if (!is_file($fichier)) {
            throw new RuntimeException("Données de référence introuvables : {$fichier}.");
        }
        $colonnes = array_flip(Schema::getColumnListing($table));
        $json = $this->colonnesDeType($table, ['array', 'json']);
        $lignes = [];
        foreach (require $fichier as $ligne) {
            if (!isset($ligne['id']) || $ligne['id'] >= self::ID_DES_COMPTES) {
                throw new RuntimeException("{$table} : chaque ligne du livre a un id fixe, sous " . self::ID_DES_COMPTES . '.');
            }
            foreach ($json as $colonne) {
                if (array_key_exists($colonne, $ligne) && $ligne[$colonne] !== null) {
                    $ligne[$colonne] = json_encode($ligne[$colonne], JSON_UNESCAPED_UNICODE);
                }
            }
            $lignes[$ligne['id']] = array_intersect_key($ligne, $colonnes);
        }
        return $lignes;
    }

    /** Le contenu d'un fichier de données, écrit depuis la table (les lignes du livre seulement) : une ligne par enregistrement. */
    public function exporter(string $table): string
    {
        $json = $this->colonnesDeType($table, ['array', 'json']);
        $booleens = $this->colonnesDeType($table, ['boolean', 'bool']);
        $requete = DB::table($table)->orderBy('id');
        if (Schema::hasColumn($table, 'user_id')) {
            $requete->whereNull('user_id');
        }
        $sortie = "<?php\n\n// Données de référence de Cyberpunk RED : table {$table}. Seule source de ces lignes (voir CprReferenceCatalogue) ;\n"
            . "// l'id est fixe et ne se réutilise jamais. Après une modification : php artisan cpr:reference.\n\nreturn [\n";
        foreach ($requete->get() as $ligne) {
            $valeurs = [];
            foreach ((array) $ligne as $colonne => $valeur) {
                if (in_array($colonne, ['created_at', 'updated_at', 'user_id'], true)) {
                    continue;
                }
                if (in_array($colonne, $json, true) && $valeur !== null) {
                    $valeur = json_decode($valeur, true);
                } elseif (in_array($colonne, $booleens, true)) {
                    $valeur = (bool) $valeur;
                } elseif (is_string($valeur) && preg_match('/^-?\d+$/', $valeur) && !in_array($colonne, ['code', 'nom', 'precision'], true)) {
                    $valeur = (int) $valeur;
                }
                $valeurs[] = var_export($colonne, true) . ' => ' . $this->php($valeur);
            }
            $sortie .= '    [' . implode(', ', $valeurs) . "],\n";
        }
        return $sortie . "];\n";
    }

    private function synchroniserLaTable(string $table): array
    {
        $bilan = ['ajoutees' => 0, 'modifiees' => 0, 'inchangees' => 0, 'absentes_du_fichier' => []];
        $lignes = $this->lignes($table);
        $horodatage = Schema::hasColumn($table, 'created_at');
        $existantes = DB::table($table)->whereIn('id', array_keys($lignes))->get()->keyBy('id');
        $maintenant = now();
        foreach ($lignes as $id => $ligne) {
            $existante = $existantes[$id] ?? null;
            if ($existante === null) {
                DB::table($table)->insert($horodatage ? [...$ligne, 'created_at' => $maintenant, 'updated_at' => $maintenant] : $ligne);
                $bilan['ajoutees']++;
            } elseif ($this->differe($ligne, $existante)) {
                DB::table($table)->where('id', $id)->update($horodatage ? [...$ligne, 'updated_at' => $maintenant] : $ligne);
                $bilan['modifiees']++;
            } else {
                $bilan['inchangees']++;
            }
        }
        $bilan['absentes_du_fichier'] = $this->livreHorsFichier($table, array_keys($lignes));
        return $bilan;
    }

    private function comparer(string $table): array
    {
        $bilan = ['ajoutees' => 0, 'modifiees' => 0, 'inchangees' => 0, 'absentes_du_fichier' => []];
        $lignes = $this->lignes($table);
        $existantes = DB::table($table)->whereIn('id', array_keys($lignes))->get()->keyBy('id');
        foreach ($lignes as $id => $ligne) {
            $existante = $existantes[$id] ?? null;
            $bilan[$existante === null ? 'ajoutees' : ($this->differe($ligne, $existante) ? 'modifiees' : 'inchangees')]++;
        }
        $bilan['absentes_du_fichier'] = $this->livreHorsFichier($table, array_keys($lignes));
        return $bilan;
    }

    /** Une ligne du livre (sans compte) qui est en base mais plus dans le fichier : signalée, jamais supprimée. */
    private function livreHorsFichier(string $table, array $ids): array
    {
        $requete = DB::table($table)->whereNotIn('id', $ids)->where('id', '<', self::ID_DES_COMPTES);
        if (Schema::hasColumn($table, 'user_id')) {
            $requete->whereNull('user_id');
        }
        return $requete->pluck('id')->map(fn ($id) => (int) $id)->all();
    }

    private function differe(array $ligne, object $existante): bool
    {
        foreach ($ligne as $colonne => $valeur) {
            $actuelle = $existante->$colonne ?? null;
            if (is_bool($valeur)) {
                $valeur = (int) $valeur;
            }
            if ($this->normaliser($valeur) !== $this->normaliser($actuelle)) {
                return true;
            }
        }
        return false;
    }

    /** Pour comparer une valeur du fichier et une valeur de la base : même JSON quel que soit l'ordre des espaces, nombres en texte. */
    private function normaliser(mixed $valeur): ?string
    {
        if ($valeur === null) {
            return null;
        }
        $texte = (string) $valeur;
        $json = json_decode($texte, true);
        return is_array($json) ? json_encode($json, JSON_UNESCAPED_UNICODE) : $texte;
    }

    /** Les objets créés par les comptes prennent leurs ids à partir de ID_DES_COMPTES (tables qui ont un `user_id`). */
    private function reserverLesIdsDuLivre(string $table): void
    {
        if (!Schema::hasColumn($table, 'user_id')) {
            return;
        }
        $plancher = self::ID_DES_COMPTES - 1;
        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            $prochain = max(self::ID_DES_COMPTES, (int) DB::table($table)->max('id') + 1);
            DB::statement("ALTER TABLE `{$table}` AUTO_INCREMENT = {$prochain}");
        } elseif ($driver === 'sqlite') {
            $sequence = DB::table('sqlite_sequence')->where('name', $table)->value('seq');
            if ($sequence === null) {
                DB::table('sqlite_sequence')->insert(['name' => $table, 'seq' => $plancher]);
            } elseif ($sequence < $plancher) {
                DB::table('sqlite_sequence')->where('name', $table)->update(['seq' => $plancher]);
            }
        }
    }

    /** Les colonnes d'une table que son modèle déclare de l'un de ces types. */
    private function colonnesDeType(string $table, array $types): array
    {
        /** @var Model $modele */
        $modele = new (self::TABLES[$table])();
        return array_keys(array_filter($modele->getCasts(), fn ($type) => in_array($type, $types, true)));
    }

    /** Une valeur PHP sur une ligne : tableaux courts, chaînes entre apostrophes. */
    private function php(mixed $valeur): string
    {
        if (is_array($valeur)) {
            $liste = array_is_list($valeur);
            $elements = [];
            foreach ($valeur as $cle => $element) {
                $elements[] = ($liste ? '' : var_export($cle, true) . ' => ') . $this->php($element);
            }
            return '[' . implode(', ', $elements) . ']';
        }
        return $valeur === null ? 'null' : var_export($valeur, true);
    }
}
