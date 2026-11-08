import {BolHerosModel} from '../models/bol-heros.model';

/** Les langues d'un personnage (héros ou PNJ), en toutes lettres : « Lémurien, Haut-lémurien ». */
export function languesDe(personnage: BolHerosModel): string {
  return personnage.origines.langues
    .filter((langue): langue is Exclude<(typeof personnage.origines.langues)[number], number> => typeof langue === 'object')
    .map((langue) => langue.langue?.langue ?? '')
    .filter(Boolean)
    .join(', ');
}

/** Les carrières d'un personnage et leur rang : « Marchand 2, Sorcier 1 ». */
export function carrieresDe(personnage: BolHerosModel): string {
  return personnage.carrieres
    .filter((c) => c.carriere?.carriere)
    .map((c) => `${c.carriere?.carriere} ${c.value}`)
    .join(', ');
}
