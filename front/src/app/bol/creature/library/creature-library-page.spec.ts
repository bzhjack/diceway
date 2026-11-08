import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {BolCreatureModel, BolCreatureTailleModel} from '../../models/bol-creature.model';
import {BolFicheScenario} from '../../models/bol-fiche-scenario.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {CreatureLibraryPageComponent} from './creature-library-page';

const TAILLES: Record<string, BolCreatureTailleModel> = {
  tresPetite: {id: 2, taille: 'Très petite', type: 'P', vigueur: 0, vitalite: 2, degats: 'd3', deplacement: ''},
  moyenne: {id: 4, taille: 'Moyenne', type: 'C', vigueur: 0, vitalite: 10, degats: 'd6', deplacement: ''},
  grande: {id: 5, taille: 'Grande', type: 'R', vigueur: 0, vitalite: 20, degats: 'd6B', deplacement: ''},
};
const DIEU_VOILE: BolFicheScenario = {id: 'dv', titre: 'Le Dieu voilé', one_shot: false};
const PERLE: BolFicheScenario = {id: 'pb', titre: 'Perle du Beshaar', one_shot: false};

function creature(
  nom: string,
  over: {user?: boolean; taille?: BolCreatureTailleModel; vitalite?: number; capacites?: string[]; scenarios?: BolFicheScenario[]} = {},
): BolCreatureModel {
  const taille = over.taille ?? TAILLES['grande'];
  return {
    id: nom,
    user_id: over.user ? 'moi' : null,
    nom,
    vigueur: 0,
    agilite: 0,
    esprit: 0,
    vitalite: over.vitalite ?? 10,
    attaque: 1,
    defense: 0,
    degats: 'd6',
    protection: '0',
    avatar: null,
    commentaire: null,
    id_taille: taille.id,
    taille,
    capacites: (over.capacites ?? []).map((c, i) => ({
      capacite: {id: i, capacite: c, de_bonus: false, de_malus: false, description: ''},
      capacite_id: i,
      creature_id: nom,
      detail: '',
      id: i,
    })),
    scenarios: over.scenarios ?? [],
  } as BolCreatureModel;
}

const CREATURES: BolCreatureModel[] = [
  creature('Momie royale', {user: true, taille: TAILLES['moyenne'], vitalite: 10, scenarios: [DIEU_VOILE]}),
  creature('Andrak', {vitalite: 20, capacites: ['Rugissement']}),
  creature('Cathgan', {taille: TAILLES['tresPetite'], vitalite: 2, scenarios: [PERLE]}),
  creature('Azhdarkho', {vitalite: 25, scenarios: [DIEU_VOILE]}),
  creature('Fille de Djidaâ', {user: true, taille: TAILLES['moyenne'], vitalite: 12, scenarios: [PERLE]}),
];

describe('CreatureLibraryPageComponent', () => {
  async function rendre(creatures = CREATURES) {
    const open = vi.fn(() => ({afterClosed: () => of(false)}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolCreaturesService, useValue: {creatures: () => of(creatures), deleteCreature: vi.fn(() => of({}))}},
        {provide: BolCreatureStateService, useValue: {tailleList: signal(Object.values(TAILLES))}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: MatDialog, useValue: {open}},
      ],
    });
    const fixture = TestBed.createComponent(CreatureLibraryPageComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const noms = () => [...page.querySelectorAll('.dw-lr-nom-texte')].map((n) => n.textContent?.trim());
    const ligne = (nom: string) => [...page.querySelectorAll('tbody tr')].find((tr) => tr.querySelector('.dw-lr-nom-texte')?.textContent?.trim() === nom)!;
    const bouton = (selecteur: string, libelle: string) =>
      [...page.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    return {page, fixture, open, texte, noms, ligne, bouton, cliquer};
  }

  it('liste toutes les créatures en lignes, par nom, avec leur taille, leur rang et leur source', async () => {
    const {noms, ligne, texte} = await rendre();

    expect(noms()).toEqual(['Andrak', 'Azhdarkho', 'Cathgan', 'Fille de Djidaâ', 'Momie royale']);
    expect(texte(ligne('Cathgan').querySelector('.cl-taille-cellule'))).toBe('Très petite');
    expect(texte(ligne('Cathgan').querySelector('.cl-type-cellule'))).toBe('Piétaille');
    const source = (nom: string) => [...ligne(nom).querySelector('.dw-lr-source')!.children].map((e) => texte(e));
    expect(source('Azhdarkho')).toEqual(['Catalogue', 'Le Dieu voilé']);
    expect(source('Momie royale')).toEqual(['Mes fiches', 'Le Dieu voilé']);
  });

  it('seules les fiches du compte se modifient et se suppriment ; le catalogue commun est en lecture seule', async () => {
    const {ligne} = await rendre();

    expect(ligne('Momie royale').querySelector('a[aria-label="Modifier Momie royale"]')?.getAttribute('href')).toBe('/create/creature/Momie%20royale');
    expect(ligne('Momie royale').querySelector('button[aria-label="Supprimer Momie royale"]')).not.toBeNull();
    expect(ligne('Andrak').querySelector('.dw-lr-actions')?.children.length).toBe(0);
  });

  it('filtre par source, chaque option avec son nombre de créatures', async () => {
    const {noms, bouton, cliquer, texte} = await rendre();

    expect(texte(bouton('.dw-lr-option', 'Catalogue commun').querySelector('.dw-lr-option-compte'))).toBe('3');
    expect(texte(bouton('.dw-lr-option', 'Mes fiches').querySelector('.dw-lr-option-compte'))).toBe('2');
    await cliquer(bouton('.dw-lr-option', 'Mes fiches'));

    expect(noms()).toEqual(['Fille de Djidaâ', 'Momie royale']);
    expect(bouton('.dw-lr-option', 'Mes fiches').getAttribute('aria-pressed')).toBe('true');
  });

  it('filtre par scénario, catalogue compris, à la teinte de chaque saga ; un second clic le retire', async () => {
    const {noms, bouton, cliquer, texte} = await rendre();
    const dieuVoile = bouton('.dw-lr-option', 'Le Dieu voilé');

    expect(texte(dieuVoile.querySelector('.dw-lr-option-compte'))).toBe('2');
    expect(dieuVoile.classList).toContain('dw-saga--1');
    expect(bouton('.dw-lr-option', 'Perle du Beshaar').classList).toContain('dw-saga--2');
    await cliquer(dieuVoile);
    expect(noms()).toEqual(['Azhdarkho', 'Momie royale']);

    await cliquer(dieuVoile);
    expect(noms().length).toBe(5);
  });

  it('trie par type, de la piétaille au rival', async () => {
    const {noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-tri', 'Type'));

    expect(noms()).toEqual(['Cathgan', 'Fille de Djidaâ', 'Momie royale', 'Andrak', 'Azhdarkho']);
  });

  it('filtre par rang', async () => {
    const {noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-chip', 'Piétaille'));

    expect(noms()).toEqual(['Cathgan']);
  });

  it('trie par colonne, et inverse le sens au second clic', async () => {
    const {page, noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-tri', 'Vit.'));
    expect(noms()).toEqual(['Cathgan', 'Momie royale', 'Fille de Djidaâ', 'Andrak', 'Azhdarkho']);
    expect(bouton('.dw-lr-tri', 'Vit.').closest('th')?.getAttribute('aria-sort')).toBe('ascending');

    await cliquer(bouton('.dw-lr-tri', 'Vit.'));
    expect(noms()[0]).toBe('Azhdarkho');
    expect(bouton('.dw-lr-tri', 'Vit.').closest('th')?.getAttribute('aria-sort')).toBe('descending');
    expect(page.querySelector('th[aria-sort="ascending"]')).toBeNull();
  });

  it('la recherche trouve aussi une capacité ou un scénario', async () => {
    const {page, noms, fixture} = await rendre();
    const champ = page.querySelector<HTMLInputElement>('dw-library-toolbar input')!;

    champ.value = 'rugiss';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(noms()).toEqual(['Andrak']);

    champ.value = 'perle';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(noms()).toEqual(['Cathgan', 'Fille de Djidaâ']);
  });

  it('« Effacer les filtres » paraît avec un filtre et les retire tous', async () => {
    const {page, noms, bouton, cliquer} = await rendre();
    expect(page.querySelector('.dw-lr-effacer')).toBeNull();

    await cliquer(bouton('.dw-lr-option', 'Mes fiches'));
    await cliquer(bouton('.dw-lr-chip', 'Coriace'));
    await cliquer(page.querySelector<HTMLButtonElement>('.dw-lr-effacer')!);

    expect(noms().length).toBe(5);
    expect(page.querySelector('.dw-lr-effacer')).toBeNull();
  });

  it('un clic sur le nom ouvre le statbloc', async () => {
    const {ligne, open} = await rendre();

    ligne('Andrak').querySelector<HTMLButtonElement>('.dw-lr-nom')!.click();

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('sans résultat, le dit', async () => {
    const {page, bouton, cliquer, texte} = await rendre();

    await cliquer(bouton('.dw-lr-option', 'Mes fiches'));
    await cliquer(bouton('.dw-lr-chip', 'Piétaille'));

    expect(texte(page.querySelector('.dw-lr-vide'))).toBe('Aucune créature ne correspond à ces filtres.');
  });
});
