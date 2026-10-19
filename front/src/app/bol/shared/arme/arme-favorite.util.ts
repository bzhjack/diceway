import {ARMES_REGIONALES} from '../../bol-rules.constants';
import {ArmeFavoriteTrait, EtoileArme} from '../models/arme-favorite.model';
import {ArmeEntry} from '../models/arme-list.model';

/** Un nom d'arme sans casse, accents ni différence d'apostrophe. */
function nomArme(nom: string): string {
  return nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'").trim().toLowerCase();
}

/** Une arme est-elle l'arme favorite nommée ? Même nom (casse, accents et apostrophes mis à part), ou l'un des noms d'une arme double
 * du catalogue (« Javelot / fléchette ») — jamais un nom qui ne fait que commencer pareil (« Épée » n'est pas l'épée valgardienne). */
export function estArmeFavorite(favorite: string | null, arme: string | null): boolean {
  if (!favorite || !arme) {
    return false;
  }
  const cherche = nomArme(favorite);
  return nomArme(arme) === cherche || arme.split('/').some((nom) => nomArme(nom) === cherche);
}

/** Les étoiles « arme favorite » d'une liste d'armes (avantage « Arme favorite », livre p. 40), alignées sur la liste ; `null` sans
 * l'avantage. Avantage régional : l'arme est imposée, aucune étoile ne bouge. Avantage général : l'étoile va sur toute arme, sauf
 * l'arme régionale d'une autre région (Mythic+) — sans région connue (un PNJ), pas de restriction. */
export function etoilesArmeFavorite(
  armes: readonly ArmeEntry[],
  favorite: ArmeFavoriteTrait | null,
  regionHeros: number | null,
): readonly EtoileArme[] | null {
  if (!favorite) {
    return null;
  }
  return armes.map((arme) => {
    const active = estArmeFavorite(favorite.arme, arme.label);
    if (favorite.regionId !== null) {
      return {active, raison: active ? 'Imposée par l’avantage régional.' : `Imposée par l’avantage régional : ${favorite.arme ?? '—'}.`};
    }
    const regionale = ARMES_REGIONALES.find((r) => estArmeFavorite(r.arme, arme.label));
    const interdite = !!regionale && regionHeros !== null && regionale.regionId !== Number(regionHeros);
    return {active, raison: interdite ? `Arme régionale réservée aux héros de ${regionale.region}.` : null};
  });
}
