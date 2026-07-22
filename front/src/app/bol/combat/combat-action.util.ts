import {BolHerosArmeModel} from '../models/bol-arme.model';
import {parseDegatsDice} from './combat-attack.util';

export type CombatActionId = 'normale' | 'offensive' | 'intrepide' | 'defaut-armure' | 'deux-armes';

/** Option d'action du tour proposée dans le menu épée (cf. `doc/rules/02-actions-combat.md`, section « Options de combat »). */
export interface CombatActionOption {
  readonly id: CombatActionId;
  readonly label: string;
  readonly icon: string;
  /** Modificateur fixe au jet d'attaque (le malus de « Défaut de l'armure » est dynamique, résolu à l'ouverture du dialog). */
  readonly atqMod: number;
  readonly modLabel: string;
  readonly description: string;
}

export const NORMALE_ACTION: CombatActionOption = {
  id: 'normale',
  label: 'Attaque normale',
  icon: 'check_circle',
  atqMod: 0,
  modLabel: '—',
  description: "Jet d'attaque standard, sans modificateur.",
};

const BASE_ACTIONS: readonly CombatActionOption[] = [
  NORMALE_ACTION,
  {
    id: 'offensive',
    label: 'Posture offensive',
    icon: 'trending_up',
    atqMod: 1,
    modLabel: '+1 atq / −1 déf',
    description: "+1 au jet d'attaque, −1 en défense ce round.",
  },
  {
    id: 'intrepide',
    label: 'Attaque intrépide',
    icon: 'local_fire_department',
    atqMod: 2,
    modLabel: '+2 atq / −2 déf',
    description: "+2 au jet d'attaque, −2 en défense ; pas de bouclier ni d'arme secondaire de parade.",
  },
  {
    id: 'defaut-armure',
    label: "Défaut de l'armure",
    icon: 'my_location',
    atqMod: 0,
    modLabel: '− protection cible',
    description: "Malus au jet d'attaque égal à la protection fixe adverse ; si l'attaque touche, les dégâts ignorent entièrement l'armure.",
  },
];

const DEUX_ARMES_ACTION: CombatActionOption = {
  id: 'deux-armes',
  label: 'Deux armes (double frappe)',
  icon: 'call_split',
  atqMod: -1,
  modLabel: '−1 atq / dégâts +1 cat.',
  description:
    "Un seul jet d'attaque à −1. Les dégâts montent d'une catégorie : 2 légères → moyenne ; 1 moyenne + 1 légère ou 2 moyennes → lourde.",
};

/** Armes utilisables en combat à deux armes : uniquement légères (d6M) ou moyennes (d6). */
function isDualWieldEligible(arme: BolHerosArmeModel): boolean {
  const kind = parseDegatsDice(arme.arme?.degats);
  return kind === 'd6m' || kind === 'd6';
}

/** Liste des actions proposées dans le menu épée — l'option « deux armes » n'apparaît que si le héros possède au moins deux armes légères/moyennes. */
export function combatActionsFor(armes: readonly BolHerosArmeModel[] | null): readonly CombatActionOption[] {
  const eligible = (armes ?? []).filter(isDualWieldEligible);
  return eligible.length >= 2 ? [...BASE_ACTIONS, DEUX_ARMES_ACTION] : BASE_ACTIONS;
}

/**
 * Dégâts combinés du combat à deux armes (02-actions-combat.md) : prend les deux premières armes
 * éligibles (légère/moyenne) du héros. 2 légères → moyenne ; sinon (moyenne+légère ou 2 moyennes) → lourde.
 */
export function dualWieldDegats(armes: readonly BolHerosArmeModel[]): string {
  const [first, second] = armes.filter(isDualWieldEligible);
  const bothLegeres = parseDegatsDice(first?.arme?.degats) === 'd6m' && parseDegatsDice(second?.arme?.degats) === 'd6m';
  return bothLegeres ? 'd6' : 'd6b';
}

/** Choix résolu par le menu épée, transmis au dialog de jet d'attaque. */
export interface AttackChoice {
  readonly action: CombatActionOption;
  /** Dégâts de l'arme choisie (ou combo deux-armes) — `null` si aucune arme n'a été sélectionnée (garde les dégâts déjà résolus par défaut). */
  readonly degats: string | null;
}
