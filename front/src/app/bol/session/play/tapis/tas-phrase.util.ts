import {PostureChoice} from '../../models/turn-assistant.model';

/** Un nombre signé, le moins typographique : « +1 », « −2 ». */
function signe(valeur: number): string {
  return valeur > 0 ? `+${valeur}` : `−${Math.abs(valeur)}`;
}

/** La posture dans la phrase du tour : « sans posture », « en défense totale », « en posture offensive ». */
export function postureEnPhrase(choix: PostureChoice | null | undefined): string {
  if (!choix || choix.slug === 'none') {
    return 'sans posture';
  }
  if (choix.attaque === null) {
    return 'en défense totale';
  }
  return `en posture ${choix.name.toLocaleLowerCase('fr')}`;
}

/** Ce que fait une posture, en clair : « +1 pour toucher, −1 en défense », « ni bonus ni malus ». */
export function postureEnClair(choix: PostureChoice): string {
  if (choix.attaque === null) {
    return `pas d’attaque ; ${signe(choix.defense)} en défense jusqu’à son prochain tour`;
  }
  const parts = [choix.attaque !== 0 ? `${signe(choix.attaque)} pour toucher` : '', choix.defense !== 0 ? `${signe(choix.defense)} en défense` : ''].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'ni bonus ni malus';
}
