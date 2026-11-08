import {BolFicheScenario} from '../models/bol-fiche-scenario.model';
import {BolHerosModel} from '../models/bol-heros.model';

/** Un héros ou un PNJ pour les tests des bibliothèques : ce qu'elles affichent, le reste à zéro. */
export function personnage(
  nom: string,
  over: {
    type?: string;
    user?: boolean;
    active?: boolean;
    joueur?: string;
    region?: [number, string];
    vitalite?: number;
    heroisme?: number;
    carrieres?: [string, number][];
    scenarios?: BolFicheScenario[];
  } = {},
): BolHerosModel {
  const region = over.region ? {id: over.region[0], region: over.region[1], noms: [], nomsFeminins: [], nomsMasculins: []} : null;
  return {
    id: nom,
    user_id: over.user ? 'moi' : null,
    active: over.active ?? true,
    type: over.type ?? 'H',
    combat: {initiative: 0, initiative_effective: 0, melee: 1, tir: 0, defense: 0, defense_effective: 0},
    attributs: {vigueur: 0, agilite: 0, agilite_effective: 0, esprit: 0, aura: 0},
    origines: {nom, joueur: over.joueur ?? null, region_id: region?.id ?? null, region, avatar: null, langues: []},
    ressources: {vitalite: over.vitalite ?? 10, heroisme: over.heroisme ?? 0, foi: 0, pouvoir: 0, vilenie: 0, creation: 0, experience: 0},
    equipement_effectif: {bouclier_malus_attaque_subie: 0, bouclier_malus_attaque_subie_portee: null, bouclier_defense_toutes: 0},
    traits: [],
    carrieres: (over.carrieres ?? []).map(([carriere, value]) => ({value, carriere: {carriere, description: '', detail: ''}})),
    armures: [],
    armes: [],
    scenarios: over.scenarios ?? [],
  } as BolHerosModel;
}
