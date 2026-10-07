import {BolHerosArmureModel} from '../../../models/bol-armure.model';
import {BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolFightSessionModel, CombatCamp} from '../../../models/bol-fight-session.model';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {firstEquippedDegats, isArmeEquipee} from '../../../shared/arme/arme-equipee';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {TapisKind, TapisCard, TapisRows, VitaliteStepper, HeroHeaderStat, HeroDetailTrait, HeroDetailInfos, HeroDetails} from '../../models/tapis.model';

const NO_VALUE = '—';

const KIND_LABELS: Record<TapisKind, string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

const RANK_LABELS: Record<string, string> = {
  rival: 'Rival',
  coriace: 'Coriace',
  pietaille: 'Piétaille',
};

const KIND_ORDER: Record<TapisKind, number> = {hero: 0, pnj: 1, creature: 2, demon: 3};

function rankLabel(rang: string | null | undefined): string {
  return RANK_LABELS[rang ?? ''] ?? 'Coriace';
}

function badgeFor(camp: CombatCamp, rang: string, qty: number): string {
  if (qty > 1) {
    return `×${qty}`;
  }
  return camp === 'heros' ? 'Allié' : rang;
}

/** Vitalité de chaque exemplaire d'un lot ; un exemplaire sans valeur enregistrée (anciennes
 * sessions) reprend la vitalité courante de la ligne. */
function batchInstances(qty: number, stored: readonly number[] | null | undefined, fallback: number): number[] {
  return Array.from({length: qty}, (_, index) => stored?.[index] ?? fallback);
}

/** Les cartes du tapis, une par ligne de session : héros, puis PNJ, créatures et démons. */
export function buildTapisCards(session: BolFightSessionModel): TapisCard[] {
  const cards: TapisCard[] = [];

  for (const h of session.heros ?? []) {
    const defense = h.heros?.combat?.defense_effective ?? h.heros?.combat?.defense;
    cards.push({
      key: `hero-${h.id}`,
      kind: 'hero',
      camp: 'heros',
      pivotId: h.id,
      sourceId: h.heros_id,
      nom: h.heros?.origines.nom ?? 'Héros',
      avatar: h.heros?.origines.avatar || EMPTY_AVATAR,
      badge: null,
      rang: null,
      degats: firstEquippedDegats(h.heros?.armes) ?? NO_VALUE,
      defense: defense === undefined ? NO_VALUE : String(defense),
      vitaliteCourante: h.vitalite_courante ?? h.heros?.ressources?.vitalite ?? null,
      vitaliteMax: h.heros?.ressources?.vitalite ?? null,
      instances: null,
      qty: 1,
    });
  }

  for (const p of session.pnjs ?? []) {
    const rang = rankLabel(p.rang);
    cards.push({
      key: `pnj-${p.id}`,
      kind: 'pnj',
      camp: p.camp,
      pivotId: p.id,
      sourceId: p.pnj_id,
      nom: p.surnom ?? p.nom,
      avatar: p.pnj?.origines.avatar || (p.pnj_id ? `/assets/bol/pnj/${p.pnj_id}.jpg` : null) || EMPTY_AVATAR,
      badge: badgeFor(p.camp, rang, 1),
      rang,
      degats: p.armes?.find((a) => a.degats)?.degats ?? NO_VALUE,
      defense: String(p.defense),
      vitaliteCourante: p.vitalite_courante,
      vitaliteMax: p.vitalite_max,
      instances: null,
      qty: 1,
    });
  }

  for (const c of session.creatures ?? []) {
    const qty = Math.max(1, c.qty);
    const rang = rankLabel(c.rang);
    cards.push({
      key: `creature-${c.id}`,
      kind: 'creature',
      camp: c.camp,
      pivotId: c.id,
      sourceId: c.creature_id,
      nom: c.surnom ?? c.nom,
      avatar: c.creature?.avatar || (c.creature_id ? `/assets/bol/bestiary/${c.creature_id}.jpg` : null) || EMPTY_AVATAR,
      badge: badgeFor(c.camp, rang, qty),
      rang,
      degats: c.degats ?? NO_VALUE,
      defense: String(c.defense),
      vitaliteCourante: c.vitalite_instances?.[0] ?? c.vitalite_courante,
      vitaliteMax: c.vitalite_max,
      instances: qty > 1 ? batchInstances(qty, c.vitalite_instances, c.vitalite_courante) : null,
      qty,
    });
  }

  for (const d of session.demons ?? []) {
    const qty = Math.max(1, d.qty);
    const rang = rankLabel(d.rang);
    cards.push({
      key: `demon-${d.id}`,
      kind: 'demon',
      camp: d.camp,
      pivotId: d.id,
      sourceId: d.demon_id,
      nom: d.surnom ?? d.nom,
      avatar: d.demon?.avatar || (d.demon_id ? `/assets/bol/demon/${d.demon_id}.jpg` : null) || EMPTY_AVATAR,
      badge: badgeFor(d.camp, rang, qty),
      rang,
      degats: d.degats ?? NO_VALUE,
      defense: String(d.defense),
      vitaliteCourante: d.vitalite_instances?.[0] ?? d.vitalite_courante,
      vitaliteMax: d.vitalite_max,
      instances: qty > 1 ? batchInstances(qty, d.vitalite_instances, d.vitalite_courante) : null,
      qty,
    });
  }

  return cards;
}

function byKindThenArrival(left: TapisCard, right: TapisCard): number {
  return KIND_ORDER[left.kind] - KIND_ORDER[right.kind] || left.pivotId - right.pivotId;
}

/** Répartit les cartes sur les deux rangs, dans l'ordre d'affichage : par type, puis par ordre
 * d'arrivée. Dans le rang du bas, les héros passent avant les alliés. */
export function splitRows(cards: readonly TapisCard[]): TapisRows {
  return {
    presents: cards.filter((card) => card.camp === 'adversaires').sort(byKindThenArrival),
    heros: cards.filter((card) => card.camp === 'heros').sort(byKindThenArrival),
  };
}

/** Carte dépliée : celle dont la clé est donnée, ou `null` si elle n'est plus sur la table. */
export function findCard(cards: readonly TapisCard[], key: string | null): TapisCard | null {
  return key ? (cards.find((card) => card.key === key) ?? null) : null;
}

/** Nom d'une carte tel qu'on la désigne dans une liste : « Hippocampe ×3 » pour un lot. */
export function cardLabel(card: TapisCard): string {
  return card.qty > 1 ? `${card.nom} ×${card.qty}` : card.nom;
}

/** Chiffre « Vit. » de la face : `courante/max`, ou le maximum seul pour un lot (ses jauges portent
 * le courant de chaque exemplaire). */
export function vitaliteText(card: TapisCard): string {
  if (card.instances) {
    return card.vitaliteMax === null ? NO_VALUE : String(card.vitaliteMax);
  }
  if (card.vitaliteCourante === null || card.vitaliteMax === null) {
    return NO_VALUE;
  }
  return `${card.vitaliteCourante}/${card.vitaliteMax}`;
}

/** Remplissage d'une barre de vitalité, de 0 à 100. Sans valeur exploitable, la barre est pleine. */
export function vitalitePercent(courante: number | null, max: number | null): number {
  if (courante === null || max === null || max <= 0) {
    return 100;
  }
  return Math.max(0, Math.min(100, (courante / max) * 100));
}

/** Vitalité à la moitié du maximum ou en dessous : la barre passe au rouge. */
export function isLowVitalite(courante: number | null, max: number | null): boolean {
  return courante !== null && max !== null && max > 0 && courante <= max / 2;
}

/** Libellé accessible de la face d'une carte : nom, type, étiquette et les trois chiffres. */
export function cardAriaLabel(card: TapisCard): string {
  const parts = [card.nom, KIND_LABELS[card.kind]];
  if (card.qty > 1) {
    parts.push(`lot de ${card.qty}`);
  } else if (card.badge) {
    parts.push(card.badge);
  }
  parts.push(`dégâts ${card.degats}`, `défense ${card.defense}`);
  parts.push(
    card.instances
      ? `vitalité ${card.vitaliteMax ?? NO_VALUE} par exemplaire`
      : `vitalité ${card.vitaliteCourante ?? NO_VALUE} sur ${card.vitaliteMax ?? NO_VALUE}`,
  );
  return parts.join(', ');
}

/** Libellé de l'action de changement de camp — `null` pour un héros, qui ne change pas de camp. */
export function campActionLabel(card: TapisCard): string | null {
  if (card.kind === 'hero') {
    return null;
  }
  return card.camp === 'heros' ? 'Remettre avec les présents' : 'Passer du côté des héros';
}

/** Libellé du retrait : sur un lot, l'API retire un seul exemplaire (le dernier). */
export function removeActionLabel(card: TapisCard): string {
  return card.qty > 1 ? 'Retirer un exemplaire' : 'Retirer de la table';
}

/** Steppers de vitalité d'une carte non-héros dépliée : un par exemplaire pour un lot, un seul
 * sinon. L'index est celui que l'API attend (`null` pour un PNJ, qui n'a pas d'exemplaires). */
export function vitaliteSteppers(card: TapisCard): VitaliteStepper[] {
  if (card.instances) {
    return card.instances.map((value, index) => ({index, label: `#${index + 1}`, value}));
  }
  return [{index: card.kind === 'pnj' ? null : 0, label: 'Vitalité', value: card.vitaliteCourante ?? 0}];
}

/** De combien faire défiler une zone pour qu'un élément y soit entièrement visible, avec une marge. Positions
 * dans le même repère (ex. l'écran). Un élément plus large que la zone s'aligne sur son début. */
export function revealDelta(itemStart: number, itemEnd: number, viewStart: number, viewEnd: number, margin: number): number {
  const tooLarge = itemEnd - itemStart > viewEnd - viewStart - 2 * margin;
  if (tooLarge || itemStart < viewStart + margin) {
    return itemStart - viewStart - margin;
  }
  return Math.max(0, itemEnd - (viewEnd - margin));
}

/** Statistiques de combat d'un héros pour l'en-tête de sa carte : initiative et défense effectives (équipement
 * compris), mêlée, tir, protection de l'armure équipée et dégâts de la première arme qui en a. */
export function heroHeaderStats(hero: BolHerosModel): HeroHeaderStat[] {
  const armor = (hero.armures as readonly (BolHerosArmureModel | number)[]).find(
    (entry): entry is BolHerosArmureModel =>
      typeof entry === 'object' && entry.equipee && entry.armure?.categorie === 'armure',
  );
  const {combat} = hero;
  return [
    {label: 'Init.', value: String(combat.initiative_effective ?? combat.initiative)},
    {label: 'Mêlée', value: String(combat.melee)},
    {label: 'Tir', value: String(combat.tir)},
    {label: 'Déf.', value: String(combat.defense_effective ?? combat.defense)},
    {label: 'Prot.', value: armor?.armure?.protection || NO_VALUE},
    {label: 'Dég.', value: firstEquippedDegats(hero.armes) ?? NO_VALUE},
  ];
}

/** Carrières, traits, armes, armures et informations d'un héros, prêtes à afficher. Les entrées dont le catalogue n'est pas chargé
 * (un simple id) sont ignorées ; les armures équipées passent en premier. */
export function heroDetails(hero: BolHerosModel): HeroDetails {
  const carrieres = hero.carrieres
    .map((entry) => ({label: entry.carriere?.carriere ?? '', value: entry.value}))
    .filter((entry) => entry.label);

  const armes = (hero.armes as readonly (BolHerosArmeModel | number)[])
    .filter((entry): entry is BolHerosArmeModel => typeof entry === 'object' && Boolean(entry.arme))
    .map((entry) => ({
      id: entry.arme_id,
      label: entry.arme!.arme,
      degats: entry.arme!.degats,
      portee: entry.arme!.portee,
      equipee: isArmeEquipee(entry),
    }));

  const armures = (hero.armures as readonly (BolHerosArmureModel | number)[])
    .filter((entry): entry is BolHerosArmureModel => typeof entry === 'object' && Boolean(entry.armure))
    .map((entry) => ({
      id: entry.armure_id,
      label: entry.armure!.armure,
      protection: entry.armure!.protection,
      malus: entry.armure!.malus,
      categorie: entry.armure!.categorie,
      equipee: entry.equipee,
    }));

  const traits = hero.traits
    .map((trait): HeroDetailTrait | null => {
      const traitable = trait.traitable;
      if (traitable && 'avantage' in traitable) {
        return {label: traitable.avantage, detail: trait.detail || null, kind: 'avantage'};
      }
      if (traitable && 'desavantage' in traitable) {
        return {label: traitable.desavantage, detail: trait.detail || null, kind: 'desavantage'};
      }
      return null;
    })
    .filter((trait): trait is HeroDetailTrait => trait !== null);

  const id = hero.id;
  return {
    traits,
    infos: {
      joueur: hero.origines.joueur || null,
      region: hero.origines.region?.region || null,
      commentaire: hero.origines.commentaire || null,
      enCours: !hero.active,
    },
    editRoute: id ? ['/create/hero', id] : null,
    carrieres,
    // Tri stable : les équipées d'abord, l'ordre d'origine sinon.
    armes: [...armes.filter((a) => a.equipee), ...armes.filter((a) => !a.equipee)],
    // Tri stable : les équipées d'abord, l'ordre d'origine sinon.
    armures: [...armures.filter((a) => a.equipee), ...armures.filter((a) => !a.equipee)],
  };
}

/** « Joueur · Région » : la ligne sous le nom d'un héros. Vide si ni l'un ni l'autre n'est connu. */
export function heroIdentityLine(infos: HeroDetailInfos): string {
  return [infos.joueur, infos.region].filter(Boolean).join(' · ');
}
