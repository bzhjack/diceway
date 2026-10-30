import {ArmeFamille} from '../models/arme-icon.model';

/** Dans l'ordre : la première qui reconnaît le nom l'emporte (« Arbalète » avant « Arc », « Bâton-fronde » avant « Bâton »). */
const FAMILLES: readonly (readonly [ArmeFamille, RegExp])[] = [
  ['arbalete', /arbalete/],
  ['arc', /\barc\b/],
  ['fronde', /fronde|sarbacane/],
  ['lance', /lance|hast|khastok|javel|flechette/],
  ['hache', /hache/],
  ['dague', /dague|poignard|kriss|coutelas|couteau/],
  ['epee', /epee|sabre|cimeterre|rapiere/],
  ['baton', /baton/],
  ['masse', /masse|gourdin|morgenstern|fleau|maillet|marteau|canne/],
  ['poing', /mains nues|poing|coups/],
  ['morsure', /morsure|griffe|croc|\bdent/],
  ['improvisee', /improvis|fortune/],
];

/** La famille d'une arme d'après son nom, sans tenir compte des accents ni de la casse ; « diverses » si rien ne la reconnaît. */
export function armeFamille(nom: string | null | undefined): ArmeFamille {
  const n = (nom ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  return FAMILLES.find(([, re]) => re.test(n))?.[0] ?? 'diverses';
}
