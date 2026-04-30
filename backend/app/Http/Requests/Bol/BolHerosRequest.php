<?php

namespace App\Http\Requests\Bol;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BolHerosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nom'    => 'required|max:255',
            'joueur' => 'required|max:255',

            'attributs.vigueur' => 'sometimes|integer|min:-1|max:3',
            'attributs.agilite' => 'sometimes|integer|min:-1|max:3',
            'attributs.esprit'  => 'sometimes|integer|min:-1|max:3',
            'attributs.aura'    => 'sometimes|integer|min:-1|max:3',

            'carrieres'         => 'sometimes|array',
            'carrieres.*.value' => 'integer|min:0|max:3',

            'combat.melee'      => 'sometimes|integer|min:-1|max:3',
            'combat.tir'        => 'sometimes|integer|min:-1|max:3',
            'combat.defense'    => 'sometimes|integer|min:-1|max:3',
            'combat.initiative' => 'sometimes|integer|min:-1|max:3',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $this->validateAttributs($v);
            $this->validateCarrieres($v);
            $this->validateCombat($v);
        });
    }

    private function validateAttributs(Validator $v): void
    {
        $attributs = $this->input('attributs');
        if (!is_array($attributs)) {
            return;
        }

        $keys = ['vigueur', 'agilite', 'esprit', 'aura'];
        $values = array_filter(
            array_map(fn($k) => isset($attributs[$k]) ? (int) $attributs[$k] : null, $keys),
            fn($val) => $val !== null,
        );

        $negatives = count(array_filter($values, fn($val) => $val < 0));
        if ($negatives > 1) {
            $v->errors()->add('attributs', 'Un seul attribut peut être négatif.');
        }

        $sum = array_sum($values);
        if ($sum > 4) {
            $v->errors()->add('attributs', 'La somme des attributs ne peut pas dépasser 4.');
        }
    }

    private function validateCombat(Validator $v): void
    {
        $combat = $this->input('combat');
        if (!is_array($combat)) {
            return;
        }

        $keys = ['melee', 'tir', 'defense', 'initiative'];
        $values = array_filter(
            array_map(fn($k) => isset($combat[$k]) ? (int) $combat[$k] : null, $keys),
            fn($val) => $val !== null,
        );

        $negatives = count(array_filter($values, fn($val) => $val < 0));
        if ($negatives > 1) {
            $v->errors()->add('combat', 'Une seule aptitude de combat peut être négative.');
        }

        if (array_sum($values) > 4) {
            $v->errors()->add('combat', 'La somme des aptitudes de combat ne peut pas dépasser 4.');
        }
    }

    private function validateCarrieres(Validator $v): void
    {
        $carrieres = $this->input('carrieres');
        if (!is_array($carrieres)) {
            return;
        }

        $sum = array_sum(array_map(fn($c) => (int) ($c['value'] ?? 0), $carrieres));
        if ($sum > 4) {
            $v->errors()->add('carrieres', 'La somme des rangs de carrières ne peut pas dépasser 4.');
        }
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json(['errors' => $validator->errors()], 422)
        );
    }
}
