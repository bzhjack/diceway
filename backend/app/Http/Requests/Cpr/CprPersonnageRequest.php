<?php

namespace App\Http\Requests\Cpr;

use App\Models\Cpr\CprPersonnage;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

/**
 * La forme d'une fiche de personnage envoyée en un document (étape 2.1). Ici : types, bornes de bon sens et existence des références ;
 * l'appartenance des objets au compte est vérifiée par CprPersonnageService, les règles de création viendront à l'étape 2.3.
 */
class CprPersonnageRequest extends FormRequest
{
    public const TYPES_D_OBJET = ['equipement', 'programme', 'munition', 'vetement', 'materiel_net', 'vehicule', 'amelioration_vehicule'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'pseudo' => 'required|string|max:100',
            'joueur' => 'nullable|string|max:100',
            'type' => ['sometimes', Rule::in(['pj', 'pnj'])],
            'statut' => ['sometimes', Rule::in(['brouillon', 'actif'])],
            'methode' => ['nullable', Rule::in(['rat_des_rues', 'edgerunner', 'formule_complete'])],
            'avatar' => 'nullable|string',
            'role_id' => 'nullable|integer|exists:cpr_role,id',
            'profil_jet' => 'nullable|integer|min:1|max:10',
            'humanite' => 'nullable|integer|min:-100|max:200',
            'ps' => 'nullable|integer|min:-100|max:200',
            'chance' => 'nullable|integer|min:0|max:20',
            'reputation' => 'sometimes|integer|min:-10|max:10',
            'eddies' => 'sometimes|integer|min:0',
            'pam' => 'sometimes|integer|min:0',
            'parcours' => 'nullable|array',
            'niveau_de_vie' => 'nullable|string|max:30',
            'logement' => 'nullable|string|max:40',
            'notes' => 'nullable|string',

            'roles' => 'sometimes|array',
            'roles.*.role_id' => 'required|integer|distinct|exists:cpr_role,id',
            'roles.*.rang' => 'required|integer|min:1|max:10',
            'roles.*.details' => 'nullable|array',

            'competences' => 'sometimes|array',
            'competences.*.competence_id' => 'required|integer|exists:cpr_competence,id',
            'competences.*.precision' => 'nullable|string|max:60',
            'competences.*.niveau' => 'required|integer|min:0|max:10',

            'armes' => 'sometimes|array',
            'armes.*.arme_id' => 'required|integer|exists:cpr_arme,id',
            'armes.*.qualite' => ['sometimes', Rule::in(['mauvaise', 'ordinaire', 'excellente'])],
            'armes.*.accessoires' => 'nullable|array',
            'armes.*.accessoires.*' => 'string|exists:cpr_accessoire,code',
            'armes.*.munition' => 'nullable|string|exists:cpr_munition,code',
            'armes.*.notes' => 'nullable|string|max:255',

            'armures' => 'sometimes|array',
            'armures.*.armure_id' => 'required|integer|exists:cpr_armure,id',
            'armures.*.localisation' => ['nullable', Rule::in(['tete', 'corps'])],
            'armures.*.pa' => 'nullable|integer|min:0|max:30',
            'armures.*.equipee' => 'sometimes|boolean',

            'cyber' => 'sometimes|array',
            'cyber.*.cle' => 'required|string|max:40|distinct',
            'cyber.*.cyber_id' => 'required|integer|exists:cpr_cyber,id',
            'cyber.*.parent' => 'nullable|string|max:40',
            'cyber.*.cote' => ['nullable', Rule::in(['gauche', 'droite'])],
            'cyber.*.precision' => 'nullable|string|max:80',
            'cyber.*.ph' => 'sometimes|integer|min:0|max:50',

            'objets' => 'sometimes|array',
            'objets.*.objet_type' => ['required', Rule::in(self::TYPES_D_OBJET)],
            'objets.*.objet_id' => 'required|integer|min:1',
            'objets.*.quantite' => 'sometimes|integer|min:1|max:10000',
            'objets.*.precision' => 'nullable|string|max:60',
        ];
        foreach (CprPersonnage::CARACS as $carac) {
            $rules[$carac] = 'sometimes|integer|min:0|max:20';
        }
        return $rules;
    }

    /** Une pièce mère citée doit être un autre implant de la même fiche. */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $cles = collect($this->input('cyber', []))->pluck('cle')->filter()->all();
            foreach ($this->input('cyber', []) as $index => $cyber) {
                $parent = $cyber['parent'] ?? null;
                if ($parent !== null && ($parent === ($cyber['cle'] ?? null) || !in_array($parent, $cles, true))) {
                    $validator->errors()->add("cyber.{$index}.parent", 'La pièce mère doit être un autre implant de la fiche.');
                }
            }
        });
    }

    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(response()->json(['message' => 'Fiche invalide', 'errors' => $validator->errors()], 422));
    }
}
