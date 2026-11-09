import {describe, expect, it} from 'vitest';
import {BolDemonCategorieModel} from '../../models/bol-demon.model';
import {DemonValeurs} from '../models/demon-regles.model';
import {conformiteDemon} from './demon-regles.util';

const MINEUR: BolDemonCategorieModel = {id: 1, categorie: 'Mineur', type: 'P', pouvoirs: 1, vitalite: 10, degats: 'd6M'};
const INFERIEUR: BolDemonCategorieModel = {id: 2, categorie: 'Inférieur', type: 'C', pouvoirs: 2, vitalite: 20, degats: 'd6'};
const MAJEUR: BolDemonCategorieModel = {id: 3, categorie: 'Majeur', type: 'R', pouvoirs: 4, vitalite: 30, degats: 'd6B'};

const demon = (over: Partial<DemonValeurs> = {}): DemonValeurs => ({
  vigueur: 0,
  agilite: 0,
  esprit: 0,
  aura: 0,
  melee: 0,
  tir: 0,
  defense: 0,
  vitalite: 0,
  ...over,
});

const etats = (c: ReturnType<typeof conformiteDemon>) => Object.fromEntries((c?.lignes ?? []).map((l) => [l.cle, l.etat]));

describe('conformiteDemon : les exemples du livre (p. 131)', () => {
  it('Zullthegg, démon mineur : tout est conforme, un attribut sous 0 compris', () => {
    const c = conformiteDemon(demon({vigueur: 1, agilite: 2, esprit: -1, tir: 2, vitalite: 11}), MINEUR, ['Armes améliorées']);

    expect(etats(c)).toEqual({attributs: 'ok', aptitudes: 'ok', pouvoirs: 'ok', vitalite: 'ok'});
    expect(c?.avertissements).toEqual([]);
  });

  it('Vul’mazzanlu, démon inférieur : conforme', () => {
    const c = conformiteDemon(
      demon({vigueur: 3, agilite: 3, esprit: 2, aura: -2, melee: 3, tir: 1, defense: 2, vitalite: 23}),
      INFERIEUR,
      ['Attaques dévastatrices', 'Poison'],
    );

    expect(etats(c)).toEqual({attributs: 'ok', aptitudes: 'ok', pouvoirs: 'ok', vitalite: 'ok'});
    expect(c?.avertissements).toEqual([]);
  });

  it('Mazallakos, démon majeur : 4 points d’aptitudes restent à répartir, ce que le livre fait lui-même', () => {
    const c = conformiteDemon(
      demon({vigueur: 2, agilite: 4, esprit: 5, aura: 1, melee: 4, defense: 4, vitalite: 32}),
      MAJEUR,
      ['Forme humaine', 'Intangible', 'Savoir spécial', 'Télépathie'],
    );

    expect(etats(c)).toEqual({attributs: 'ok', aptitudes: 'reste', pouvoirs: 'ok', vitalite: 'ok'});
    expect(c?.lignes.find((l) => l.cle === 'aptitudes')?.detail).toBe('4 points à répartir');
  });
});

describe('conformiteDemon : les écarts', () => {
  it('dit les points de trop, et le maximum dépassé dans un attribut ou une aptitude', () => {
    const c = conformiteDemon(demon({vigueur: 5, agilite: 2, melee: 5, tir: 2}), INFERIEUR, []);

    expect(c?.lignes.find((l) => l.cle === 'attributs')).toMatchObject({valeur: 7, attendu: 6, etat: 'depasse', detail: '1 point de trop'});
    expect(c?.avertissements).toEqual([
      "Vigueur 5 : un démon inférieur n'a pas plus de 4.",
      "Mêlée 5 : un démon inférieur n'a pas plus de 4.",
    ]);
  });

  it('un mineur n’a pas de maximum par attribut', () => {
    expect(conformiteDemon(demon({vigueur: 3, agilite: -1}), MINEUR, [])?.avertissements).toEqual([]);
  });

  it('pas sous −2, et deux attributs sous 0 au plus ; une aptitude ne descend pas sous 0', () => {
    const c = conformiteDemon(demon({vigueur: 6, agilite: -3, esprit: -1, aura: -1, tir: -1}), MAJEUR, []);

    expect(c?.avertissements).toEqual([
      'Agilité -3 : un attribut ne descend pas sous -2.',
      '3 attributs sous 0 : deux au plus.',
      'Tir -1 : une aptitude de combat ne descend pas sous 0.',
    ]);
  });

  it('compte Cuirassé pour deux pouvoirs, et Vulnérabilité en donne un de plus', () => {
    const cuirasse = conformiteDemon(demon(), INFERIEUR, ['Cuirassé', 'Poison']);
    expect(cuirasse?.lignes.find((l) => l.cle === 'pouvoirs')).toMatchObject({
      valeur: 3,
      attendu: 2,
      etat: 'depasse',
      detail: '1 de trop · Cuirassé compte pour deux',
    });

    const vulnerable = conformiteDemon(demon(), INFERIEUR, ['Cuirassé', 'Poison', 'Vulnérabilité']);
    expect(vulnerable?.lignes.find((l) => l.cle === 'pouvoirs')).toMatchObject({valeur: 3, attendu: 3, etat: 'ok'});
  });

  it('la vitalité attendue est la base de la catégorie plus la vigueur', () => {
    const c = conformiteDemon(demon({vigueur: 3, vitalite: 20}), INFERIEUR, []);

    expect(c?.vitaliteAttendue).toBe(23);
    expect(c?.lignes.find((l) => l.cle === 'vitalite')).toMatchObject({etat: 'ecart', detail: '20 + vigueur 3'});
  });

  it('rien sans catégorie', () => {
    expect(conformiteDemon(demon(), undefined, [])).toBeNull();
  });
});
