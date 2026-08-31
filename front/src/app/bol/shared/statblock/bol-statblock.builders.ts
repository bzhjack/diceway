import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {heroBadge} from '../../hero/library/hero-card/hero-card.component';
import {pnjBadge} from '../../pnj/library/pnj-card/pnj-card.component';
import {
  BolStatblockChip,
  BolStatblockData,
  BolStatblockEntry,
  BolStatblockSection,
  BolStatblockTile,
} from './bol-statblock.component';

/** Mapping type BoL ('P'/'C'/'R') → libellé de rang. */
const RANK_LABELS: Record<string, string> = {
  P: 'Piétaille',
  C: 'Coriace',
  R: 'Rival',
};

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function creatureStatblockData(creature: BolCreatureModel): BolStatblockData {
  const rank = creature.rang
    ? capitalize(creature.rang)
    : (RANK_LABELS[creature.taille.type] ?? 'Coriace');

  return {
    accent: 'amber',
    title: creature.nom,
    isCreation: Boolean(creature.user_id),
    comment: creature.commentaire,
    chips: [
      {label: rank, variant: 'amber'},
      {label: creature.taille.taille, variant: 'muted'},
    ],
    vitals: [
      {label: 'Vitalité', value: creature.vitalite, tone: 'health'},
      {label: 'Protection', value: creature.protection || '—', dice: true},
      {label: 'Dégâts', value: creature.degats || '—', tone: 'damage', dice: true},
    ],
    tiles: [
      {label: 'Vigueur', value: creature.vigueur},
      {label: 'Agilité', value: creature.agilite},
      {label: 'Esprit', value: creature.esprit},
      {label: 'Attaque', value: creature.attaque},
      {label: 'Défense', value: creature.defense},
      {label: 'Déplacement', value: creature.taille.deplacement || '—'},
    ],
    wideTiles: false,
    sections: [
      {
        title: 'Capacités',
        emptyText: 'Aucune capacité spéciale renseignée.',
        entries: creature.capacites.map((entry) => ({
          label: entry.capacite.capacite,
          detail: entry.detail || entry.capacite.description || undefined,
        })),
      },
    ],
  };
}

export function demonStatblockData(demon: BolDemonModel): BolStatblockData {
  return {
    accent: 'rose',
    title: demon.nom,
    isCreation: Boolean(demon.user_id),
    comment: demon.commentaire,
    chips: [
      {label: RANK_LABELS[demon.type ?? demon.categorie.type] ?? 'Coriace', variant: 'rose'},
      {label: demon.categorie.categorie, variant: 'muted'},
    ],
    vitals: [
      {label: 'Vitalité', value: demon.vitalite, tone: 'health'},
      {label: 'Défense', value: demon.defense},
      {label: 'Dégâts', value: demon.degats || '—', tone: 'damage', dice: true},
    ],
    tiles: [
      {label: 'Vigueur', value: demon.vigueur},
      {label: 'Agilité', value: demon.agilite},
      {label: 'Esprit', value: demon.esprit},
      {label: 'Aura', value: demon.aura},
      {label: 'Mêlée', value: demon.melee},
      {label: 'Tir', value: demon.tir},
    ],
    wideTiles: false,
    sections: [
      {
        title: 'Pouvoirs infernaux',
        emptyText: 'Aucun pouvoir infernal renseigné.',
        entries: demon.pouvoirs.map((entry) => ({
          label: entry.pouvoir.pouvoir,
          detail: entry.detail || entry.pouvoir.description || undefined,
        })),
      },
    ],
  };
}

export function heroStatblockData(hero: BolHerosModel): BolStatblockData {
  const badge = heroBadge(hero);
  const chips: BolStatblockChip[] = [];

  if (badge) {
    chips.push({label: badge.label, variant: badge.variant});
  }
  if (hero.origines.joueur) {
    chips.push({label: hero.origines.joueur, variant: 'muted'});
  }
  if (hero.origines.region?.region) {
    chips.push({label: hero.origines.region.region, variant: 'muted'});
  }

  // Un héros appartient toujours à l'utilisateur : pas de tag « Création ».
  return herosLikeStatblockData(hero, hero.origines.nom || 'Héros sans nom', chips, false);
}

export function pnjStatblockData(pnj: BolHerosModel): BolStatblockData {
  const badge = pnjBadge(pnj);
  const chips: BolStatblockChip[] = [];

  if (badge) {
    chips.push({label: badge.label, variant: badge.variant});
  }
  if (pnj.origines.region?.region) {
    chips.push({label: pnj.origines.region.region, variant: 'muted'});
  }

  return herosLikeStatblockData(pnj, pnj.origines.nom || 'PNJ sans nom', chips, Boolean(pnj.user_id));
}

/** Base commune héros/PNJ (même modèle BolHeros) : bande vitale dérivée de l'équipement + 3 listes. */
function herosLikeStatblockData(
  heros: BolHerosModel,
  title: string,
  chips: readonly BolStatblockChip[],
  isCreation: boolean,
): BolStatblockData {
  const weapons = (heros.armes as (BolHerosArmeModel | number)[]).filter(
    (arme): arme is BolHerosArmeModel => typeof arme === 'object' && Boolean(arme.arme),
  );
  const armors = (heros.armures as (BolHerosArmureModel | number)[]).filter(
    (armure): armure is BolHerosArmureModel => typeof armure === 'object' && Boolean(armure.armure),
  );

  const mainWeapon = weapons[0]?.arme ?? null;
  const mainArmor = armors[0]?.armure ?? null;

  const vitals: BolStatblockTile[] = [
    {label: 'Vitalité', value: heros.ressources.vitalite, tone: 'health'},
  ];
  if (heros.ressources.heroisme > 0) {
    vitals.push({label: 'Héroïsme', value: heros.ressources.heroisme, tone: 'heroism'});
  }
  vitals.push(
    {label: 'Protection', value: mainArmor?.protection || '—', dice: true},
    {
      label: mainWeapon ? `Dégâts · ${mainWeapon.arme}` : 'Dégâts',
      value: mainWeapon?.degats || '—',
      tone: 'damage',
      dice: true,
    },
  );

  const careers: BolStatblockEntry[] = heros.carrieres
    .map((carriere) => ({label: carriere.carriere?.carriere ?? '', value: carriere.value}))
    .filter((entry) => entry.label);

  const traits: BolStatblockEntry[] = heros.traits
    .map((trait) => {
      const traitable = trait.traitable;
      const label =
        traitable && 'avantage' in traitable
          ? traitable.avantage
          : traitable && 'desavantage' in traitable
            ? traitable.desavantage
            : '';

      return {label, detail: trait.detail || undefined};
    })
    .filter((entry) => entry.label);

  const weaponEntries: BolStatblockEntry[] = weapons
    .map((arme) => ({
      label: arme.arme?.arme ?? '',
      detail: [arme.arme?.degats, arme.arme?.portee].filter(Boolean).join(' · ') || undefined,
    }))
    .filter((entry) => entry.label);

  const armorEntries: BolStatblockEntry[] = armors
    .map((armure) => ({
      label: armure.armure?.armure ?? '',
      detail: [armure.armure?.protection, armure.armure?.malus].filter(Boolean).join(' · ') || undefined,
    }))
    .filter((entry) => entry.label);

  const sections: BolStatblockSection[] = [
    {title: 'Carrières', emptyText: 'Aucune carrière renseignée.', entries: careers},
    {title: 'Traits', emptyText: 'Aucun trait renseigné.', entries: traits},
    {title: 'Armes', emptyText: 'Aucune arme renseignée.', entries: weaponEntries, compact: true},
    {title: 'Armures', emptyText: 'Aucune armure renseignée.', entries: armorEntries, compact: true},
  ];

  return {
    accent: 'emerald',
    title,
    isCreation,
    comment: heros.origines.commentaire ?? null,
    chips,
    vitals,
    tiles: [
      {label: 'Vig', value: heros.attributs.vigueur},
      {label: 'Agi', value: heros.attributs.agilite_effective},
      {label: 'Esp', value: heros.attributs.esprit},
      {label: 'Aura', value: heros.attributs.aura},
      {label: 'Init', value: heros.combat.initiative_effective},
      {label: 'Mêlée', value: heros.combat.melee},
      {label: 'Tir', value: heros.combat.tir},
      {label: 'Déf', value: heros.combat.defense_effective},
    ],
    wideTiles: true,
    sections,
  };
}
