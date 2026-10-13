import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {heroBadge} from '../../hero/library/hero-card/hero-card.component';
import {equippedProtection} from '../../session/combat-attack.util';
import {isArmeEquipee} from '../arme/arme-equipee';
import {pnjBadge} from '../../pnj/library/pnj-card/pnj-card.component';
import {BolStatblockChip, BolStatblockData, BolStatblockEntry, BolStatblockSection, BolStatblockTile} from '../models/bol-statblock.model';

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
    // Les créatures du catalogue (sans propriétaire) sont communes à tous : pas modifiables.
    editRoute: creature.user_id ? ['/create/creature', String(creature.id)] : null,
    advancedEditRoute: null,
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
    editRoute: demon.user_id ? ['/create/demon', String(demon.id)] : null,
    advancedEditRoute: null,
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
  const advancedEditRoute: readonly [string, string] | null = hero.active ? null : ['/create/hero-advanced', String(hero.id)];
  return herosLikeStatblockData(
    hero,
    hero.origines.nom || 'Héros sans nom',
    chips,
    false,
    ['/create/hero', String(hero.id)],
    advancedEditRoute,
  );
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

  return herosLikeStatblockData(
    pnj,
    pnj.origines.nom || 'PNJ sans nom',
    chips,
    Boolean(pnj.user_id),
    // Les PNJ du catalogue (sans propriétaire) sont communs à tous : pas modifiables.
    pnj.user_id ? ['/create/pnj', String(pnj.id)] : null,
    null,
    true,
  );
}

/** La portée d'une arme, en clair : « Portée 22 m » pour une arme de tir, « Se lance à 3 m » pour une arme de mêlée qui se lance. */
function weaponRange(arme: BolHerosArmeModel): string | undefined {
  const portee = arme.arme?.portee?.trim();
  if (!portee || portee === '-') {
    return undefined;
  }
  return arme.arme?.type === 'T' ? `Portée ${portee}` : `Se lance à ${portee}`;
}

/** Base commune héros/PNJ (même modèle BolHeros) : bande vitale dérivée de l'équipement + 3 listes. `wearsEverything` : un PNJ porte
 * tout ce qu'il possède — armes en main, armures sur le dos — quel que soit l'état « équipée » enregistré ; ses listes n'ont donc
 * pas de pastille « porté / dans le sac ». */
function herosLikeStatblockData(
  heros: BolHerosModel,
  title: string,
  chips: readonly BolStatblockChip[],
  isCreation: boolean,
  editRoute: readonly [string, string] | null,
  advancedEditRoute: readonly [string, string] | null,
  wearsEverything = false,
): BolStatblockData {
  const weapons = (heros.armes as (BolHerosArmeModel | number)[]).filter(
    (arme): arme is BolHerosArmeModel => typeof arme === 'object' && Boolean(arme.arme),
  );
  const armors = (heros.armures as (BolHerosArmureModel | number)[]).filter(
    (armure): armure is BolHerosArmureModel => typeof armure === 'object' && Boolean(armure.armure),
  );

  // Ce qu'il a en main et sur le dos : la première arme équipée, et la protection de l'armure portée (casque compris). Un bouclier
  // ne protège pas des dégâts : il reste dans la liste des armures.
  const mainWeapon = weapons.find((arme) => (wearsEverything || isArmeEquipee(arme)) && arme.arme?.degats)?.arme ?? null;
  const protection = equippedProtection(wearsEverything ? armors.map((armure) => ({...armure, equipee: true})) : armors).text;

  const vitals: BolStatblockTile[] = [
    {label: 'Vitalité', value: heros.ressources.vitalite, tone: 'health'},
  ];
  if (heros.ressources.heroisme > 0) {
    vitals.push({label: 'Héroïsme', value: heros.ressources.heroisme, tone: 'heroism'});
  }
  vitals.push(
    {
      label: mainWeapon ? `Dégâts · ${mainWeapon.arme}` : 'Dégâts',
      value: mainWeapon?.degats || '—',
      tone: 'damage',
      dice: true,
    },
    {label: 'Protection', value: protection ?? '—', dice: true},
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

      const sign = traitable && 'avantage' in traitable ? ('plus' as const) : traitable && 'desavantage' in traitable ? ('minus' as const) : undefined;
      return {label, detail: trait.detail || undefined, ...(sign ? {sign} : {})};
    })
    .filter((entry) => entry.label);

  const weaponEntries: BolStatblockEntry[] = weapons
    .map((arme) => ({
      label: arme.arme?.arme ?? '',
      value: arme.arme?.degats ?? undefined,
      detail: weaponRange(arme),
      ...(wearsEverything ? {} : {equipped: isArmeEquipee(arme)}),
    }))
    .filter((entry) => entry.label);

  const armorEntries: BolStatblockEntry[] = armors
    .map((armure) => {
      // Une armure s'écrit par son dé de protection (« d6-2 (2) »), à droite ; un bouclier ou un casque par une phrase, dessous.
      const protectionText = armure.armure?.protection ?? null;
      const isDie = !!protectionText && /^d\d/i.test(protectionText);
      return {
        label: armure.armure?.armure ?? '',
        value: isDie ? (protectionText ?? undefined) : undefined,
        // « Impose un malus de -1 à une attaque subie par round » : le début n'apprend rien, on garde « -1 à une attaque… ».
        detail: [isDie ? null : protectionText?.replace(/^Impose un malus de /, ''), armure.armure?.malus].filter((part) => part && part !== '-').join(' · ') || undefined,
        ...(wearsEverything ? {} : {equipped: armure.equipee}),
      };
    })
    .filter((entry) => entry.label);

  const sections: BolStatblockSection[] = [
    {title: 'Carrières', emptyText: 'Aucune carrière renseignée.', entries: careers},
    {title: 'Traits', emptyText: 'Aucun trait renseigné.', entries: traits},
    {title: 'Armes', emptyText: 'Aucune arme renseignée.', entries: weaponEntries},
    {title: 'Armures et boucliers', emptyText: 'Aucune armure renseignée.', entries: armorEntries},
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
    editRoute,
    advancedEditRoute,
    sections,
  };
}
