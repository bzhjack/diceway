<?php

namespace App\Http\Requests\Bol;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BolHerosRequest extends FormRequest
{
    /** bol_desavantage.id de « Non-combattant » : 6 points de carrières au lieu de 4, 2 points de combat au lieu de 4 (p. 45). */
    private const NON_COMBATTANT = 33;

    /** bol_desavantage.id de « Illettré » : pas de carrière exigeant d'être lettré (p. 44). */
    private const ILLETTRE = 17;

    /**
     * Les carrières que le livre dit lettrées, et elles seules (p. 47, « Déchiffrer un texte ») : Alchimiste, Médecin, Prêtre, Scribe.
     * Même liste que `CARRIERES_LETTREES` du front (`bol-rules.constants.ts`) ; le Sorcier n'en est pas.
     */
    private const CARRIERES_LETTREES = [1 => 'Alchimiste', 14 => 'Médecin', 21 => 'Prêtre', 22 => 'Scribe'];

    // Brouillon : les budgets de création (p. 13-16). Seul le brouillon les subit.
    private const BUDGET_ATTRIBUTS = 4;
    private const BUDGET_COMBAT = 4;
    private const BUDGET_COMBAT_NON_COMBATTANT = 2;
    private const BUDGET_CARRIERES = 4;
    private const BUDGET_CARRIERES_NON_COMBATTANT = 6;
    private const VALEUR_MAX_BROUILLON = 3;
    private const RANG_MAX_BROUILLON = 3;

    // Héros activé : le front envoie les attributs et aptitudes avec les bonus d'avantages déjà appliqués (Savant,
    // Agilité de l'homme-oiseau, Vigueur céruléenne, Prestance), donc ni budget ni plafond de création ; des bornes de bon sens
    // seulement (un humain plafonne à 5, à 6 avec certains avantages ; une carrière va jusqu'au rang 5).
    private const VALEUR_MAX_ACTIF = 6;
    private const RANG_MAX_ACTIF = 5;

    private const ATTRIBUTS = ['vigueur', 'agilite', 'esprit', 'aura'];
    private const COMBAT = ['melee', 'tir', 'defense', 'initiative'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $valeur = 'sometimes|integer|min:-1|max:' . ($this->isDraft() ? self::VALEUR_MAX_BROUILLON : self::VALEUR_MAX_ACTIF);
        $rang = 'integer|min:0|max:' . ($this->isDraft() ? self::RANG_MAX_BROUILLON : self::RANG_MAX_ACTIF);

        return [
            'nom'    => 'required|max:255',
            'joueur' => 'required|max:255',

            'attributs.vigueur' => $valeur,
            'attributs.agilite' => $valeur,
            'attributs.esprit'  => $valeur,
            'attributs.aura'    => $valeur,

            'carrieres'         => 'sometimes|array',
            'carrieres.*.value' => $rang,

            'combat.melee'      => $valeur,
            'combat.tir'        => $valeur,
            'combat.defense'    => $valeur,
            'combat.initiative' => $valeur,
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($this->isDraft()) {
                $this->validateAttributs($v);
                $this->validateCarrieres($v);
                $this->validateCombat($v);

                return;
            }

            // Comme le front : un brouillon peut encore porter l'incohérence (simple avertissement), l'activation la refuse.
            $this->validateIllettre($v);
        });
    }

    /** Une fiche non activée : la répartition de création s'y contrôle encore. */
    private function isDraft(): bool
    {
        return !$this->boolean('active');
    }

    /** Le trait « Non-combattant » est un désavantage général (`carriere` faux), pas celui d'une carrière. */
    private function isNonCombattant(): bool
    {
        $traits = $this->input('traits');
        if (!is_array($traits)) {
            return false;
        }

        foreach ($traits as $trait) {
            if (
                is_array($trait)
                && ($trait['type'] ?? null) === 'D'
                && (int) ($trait['traitable_id'] ?? 0) === self::NON_COMBATTANT
                && !filter_var($trait['carriere'] ?? false, FILTER_VALIDATE_BOOLEAN)
            ) {
                return true;
            }
        }

        return false;
    }

    /** Illettré, qu'il soit général, régional ou de carrière : tous portent le même id du catalogue. */
    private function isIllettre(): bool
    {
        $traits = $this->input('traits');
        if (!is_array($traits)) {
            return false;
        }

        foreach ($traits as $trait) {
            if (
                is_array($trait)
                && ($trait['type'] ?? null) === 'D'
                && (int) ($trait['traitable_id'] ?? $trait['id'] ?? 0) === self::ILLETTRE
            ) {
                return true;
            }
        }

        return false;
    }

    private function validateIllettre(Validator $v): void
    {
        $carrieres = $this->input('carrieres');
        if (!is_array($carrieres) || !$this->isIllettre()) {
            return;
        }

        foreach ($carrieres as $carriere) {
            // Même lecture de l'id que l'enregistrement (`BolHerosService::syncRelations`).
            $id = is_array($carriere) ? (int) ($carriere['carriere_id'] ?? $carriere['id'] ?? 0) : (int) $carriere;
            if (isset(self::CARRIERES_LETTREES[$id])) {
                $v->errors()->add('carrieres', 'Illettré : la carrière ' . self::CARRIERES_LETTREES[$id] . ' exige de savoir lire et écrire.');
            }
        }
    }

    /** Les valeurs envoyées d'un groupe (`attributs`, `combat`), entières ; vide si le groupe est absent. */
    private function scores(string $group, array $keys): array
    {
        $input = $this->input($group);
        if (!is_array($input)) {
            return [];
        }

        $scores = [];
        foreach ($keys as $key) {
            if (isset($input[$key])) {
                $scores[] = (int) $input[$key];
            }
        }

        return $scores;
    }

    private function validateAttributs(Validator $v): void
    {
        $values = $this->scores('attributs', self::ATTRIBUTS);

        if (count(array_filter($values, fn($val) => $val < 0)) > 1) {
            $v->errors()->add('attributs', 'Un seul attribut peut être négatif.');
        }

        if (array_sum($values) > self::BUDGET_ATTRIBUTS) {
            $v->errors()->add('attributs', 'La somme des attributs ne peut pas dépasser ' . self::BUDGET_ATTRIBUTS . '.');
        }
    }

    private function validateCombat(Validator $v): void
    {
        $values = $this->scores('combat', self::COMBAT);

        if (count(array_filter($values, fn($val) => $val < 0)) > 1) {
            $v->errors()->add('combat', 'Une seule aptitude de combat peut être négative.');
        }

        $budget = $this->isNonCombattant() ? self::BUDGET_COMBAT_NON_COMBATTANT : self::BUDGET_COMBAT;
        if (array_sum($values) > $budget) {
            $v->errors()->add('combat', "La somme des aptitudes de combat ne peut pas dépasser $budget.");
        }
    }

    private function validateCarrieres(Validator $v): void
    {
        $carrieres = $this->input('carrieres');
        if (!is_array($carrieres)) {
            return;
        }

        $budget = $this->isNonCombattant() ? self::BUDGET_CARRIERES_NON_COMBATTANT : self::BUDGET_CARRIERES;
        $sum = array_sum(array_map(fn($c) => (int) ($c['value'] ?? 0), $carrieres));
        if ($sum > $budget) {
            $v->errors()->add('carrieres', "La somme des rangs de carrières ne peut pas dépasser $budget.");
        }
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json(['errors' => $validator->errors()], 422)
        );
    }
}
