<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Plus de « lot » : chaque créature ou démon d'une session est sa propre ligne (donc sa propre carte).
 * Les lignes existantes avec `qty > 1` sont éclatées en `qty` lignes, chacune avec sa vitalité, et les
 * références aux exemplaires (ordre manuel, positions des jetons, état du combat) suivent.
 */
return new class extends Migration
{
    private const TABLES = ['creature' => 'bol_fight_session_creature', 'demon' => 'bol_fight_session_demon'];

    public function up(): void
    {
        // [session_id => [kind-oldId-index => kind-newId-0, kind-oldId => [kind-newId...]]]
        $remap = [];

        foreach (self::TABLES as $kind => $table) {
            foreach (DB::table($table)->where('qty', '>', 1)->orderBy('id')->get() as $row) {
                $qty = (int) $row->qty;
                $instances = json_decode($row->vitalite_instances ?? 'null', true);
                if (!is_array($instances) || count($instances) < $qty) {
                    $instances = array_pad(is_array($instances) ? $instances : [], $qty, $row->vitalite_courante ?? $row->vitalite_max);
                }

                $template = (array) $row;
                unset($template['id']);

                for ($i = 1; $i < $qty; $i++) {
                    $copy = $template;
                    $copy['qty'] = 1;
                    $copy['vitalite_instances'] = json_encode([$instances[$i]]);
                    $copy['vitalite_courante'] = $instances[$i];
                    $newId = DB::table($table)->insertGetId($copy);

                    $remap[$row->fight_session_id]["$kind-{$row->id}-$i"] = "$kind-$newId-0";
                    $remap[$row->fight_session_id]['cards']["$kind-{$row->id}"][] = "$kind-$newId";
                }

                DB::table($table)->where('id', $row->id)->update([
                    'qty'                => 1,
                    'vitalite_instances' => json_encode([$instances[0]]),
                    'vitalite_courante'  => $instances[0],
                ]);
            }
        }

        foreach ($remap as $sessionId => $map) {
            $session = DB::table('bol_fight_session')->where('id', $sessionId)->first();
            if (!$session) {
                continue;
            }
            $cards = $map['cards'] ?? [];
            unset($map['cards']);

            $update = [];
            foreach (['ordre_manuel', 'positions_jetons', 'etat_combat'] as $column) {
                $value = json_decode($session->{$column} ?? 'null', true);
                if (is_array($value)) {
                    $update[$column] = json_encode($this->remap($value, $map, $cards));
                }
            }
            if ($update !== []) {
                DB::table('bol_fight_session')->where('id', $sessionId)->update($update);
            }
        }
    }

    public function down(): void
    {
        // Les lignes éclatées ne sont pas regroupées : un lot n'a plus de sens dans l'application.
    }

    /**
     * Réécrit les clés d'exemplaire (`creature-12-2`) et, pour les listes de cartes jouées ou en défense,
     * ajoute les nouvelles cartes à côté de celle du lot d'origine (`creature-12`).
     *
     * @param array<mixed> $value
     * @param array<string, string> $instances
     * @param array<string, array<int, string>> $cards
     * @return array<mixed>
     */
    private function remap(array $value, array $instances, array $cards): array
    {
        $result = [];
        foreach ($value as $key => $item) {
            $newKey = is_string($key) && isset($instances[$key]) ? $instances[$key] : $key;
            if (is_array($item)) {
                $item = $this->remap($item, $instances, $cards);
            } elseif (is_string($item) && isset($instances[$item])) {
                $item = $instances[$item];
            }

            if (is_int($key)) {
                $result[] = $item;
                if (is_string($item) && isset($cards[$item]) && array_is_list($value)) {
                    foreach ($cards[$item] as $extra) {
                        $result[] = $extra;
                    }
                }
            } else {
                $result[$newKey] = $item;
            }
        }

        return $result;
    }
};
