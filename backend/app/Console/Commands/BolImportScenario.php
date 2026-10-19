<?php

namespace App\Console\Commands;

use App\Exceptions\Bol\ScenarioImportException;
use App\Http\Services\Bol\BolImportCatalog;
use App\Http\Services\Bol\BolScenarioImporter;
use App\Http\Services\Bol\BolScenarioImportPlan;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use JsonException;
use Throwable;

/**
 * Importe un scénario écrit en JSON (format : `doc/scenarios/format-import.md`) dans la bibliothèque d'un
 * compte : scénario, PNJ, créatures, démons et scènes. Relancer la commande met l'import précédent à jour.
 */
class BolImportScenario extends Command
{
    protected $signature = 'bol:import-scenario
        {fichier : chemin du fichier JSON}
        {--user= : e-mail du compte qui recevra le scénario}
        {--dry-run : tout vérifier, sans rien enregistrer}';

    protected $description = "Importe un scénario (scènes, PNJ, créatures, démons) depuis un fichier JSON dans la bibliothèque d'un compte";

    public function handle(BolScenarioImporter $importer): int
    {
        $path = (string) $this->argument('fichier');
        $email = (string) $this->option('user');
        if ($email === '') {
            $this->error('--user est obligatoire : un import appartient toujours à un compte, jamais au catalogue.');

            return self::FAILURE;
        }
        $user = User::where('email', $email)->first();
        if (!$user) {
            $this->error("Aucun compte « $email ».");

            return self::FAILURE;
        }
        if (!is_file($path) || !is_readable($path)) {
            $this->error("Fichier illisible : $path");

            return self::FAILURE;
        }

        try {
            $data = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            $this->error('JSON invalide : ' . $e->getMessage());

            return self::FAILURE;
        }
        if (!is_array($data)) {
            $this->error('Le fichier doit contenir un objet JSON.');

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        DB::beginTransaction();
        try {
            $plan = BolScenarioImportPlan::fromArray($data, BolImportCatalog::fromDatabase());
            $report = $importer->import($plan, (string) $user->id);
            $dryRun ? DB::rollBack() : DB::commit();
        } catch (ScenarioImportException $e) {
            DB::rollBack();
            $this->error($e->getMessage());
            foreach ($e->errors as $error) {
                $this->line("  - $error");
            }

            return self::FAILURE;
        } catch (Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->info(($dryRun ? '[simulation, rien n’est enregistré] ' : '') . "« {$plan->scenario['titre']} » pour $email :");
        $this->table(['', 'nombre'], array_map(fn ($what, $count) => [$what, $count], array_keys($report), $report));

        return self::SUCCESS;
    }
}
