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
const DIEU_VOILE: BolFicheScenario = {id: 'dv', titre: 'Le Dieu voilé'};
const PERLE: BolFicheScenario = {id: 'pb', titre: 'Perle du Beshaar'};

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
    const noms = () => [...page.querySelectorAll('.dw-lr-grille .dw-tuile__nom')].map((n) => n.textContent?.trim());
    const tuile = (nom: string) => [...page.querySelectorAll('.dw-lr-grille > li')].find((li) => li.querySelector('.dw-tuile__nom')?.textContent?.trim() === nom)!;
    const bouton = (selecteur: string, libelle: string) =>
      [...page.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    /** Ouvre la liste de ce nom, dans la barre de recherche, et y choisit l'option qui commence par ce libellé. */
    const choisir = async (liste: string, libelle: string) => {
      page.querySelector<HTMLElement>(`dw-library-toolbar mat-select[aria-label="${liste}"] .mat-mdc-select-trigger`)!.click();
      await fixture.whenStable();
      [...document.querySelectorAll<HTMLElement>('mat-option')].find((o) => o.textContent?.trim().startsWith(libelle))!.click();
      await fixture.whenStable();
    };
    return {page, fixture, open, texte, noms, tuile, bouton, cliquer, choisir};
  }

  it('montre toutes les créatures en tuiles, par nom, avec leur rang, leur sorte et leur vitalité', async () => {
    const {page, noms, tuile, texte} = await rendre();

    expect(page.querySelector('table')).toBeNull();
    expect(noms()).toEqual(['Andrak', 'Azhdarkho', 'Cathgan', 'Fille de Djidaâ', 'Momie royale']);
    expect(texte(tuile('Cathgan').querySelector('.dw-tuile-rang'))).toBe('Piétaille');
    expect(tuile('Cathgan').querySelector('.dw-tuile-sorte')?.getAttribute('aria-label')).toBe('Créature');
    expect(texte(tuile('Cathgan').querySelector('.dw-tuile__coeur b'))).toBe('2');
    expect(texte(page.querySelector('dw-library-toolbar dw-tag'))).toBe('5 créatures');
  });

  it('les fiches du compte ont la pastille et le menu, celles du catalogue n’ont ni l’un ni l’autre', async () => {
    const {fixture, tuile, texte} = await rendre();

    expect(texte(tuile('Momie royale').querySelector('.dw-tuile-marque'))).toBe('Mes fiches');
    const menu = tuile('Momie royale').querySelector<HTMLButtonElement>('button[aria-label="Actions de Momie royale"]')!;
    menu.click();
    await fixture.whenStable();
    const items = [...document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item')];
    expect(items.map((i) => texte(i.querySelector('.mat-mdc-menu-item-text')))).toEqual(['Modifier', 'Supprimer']);
    expect(items[0].getAttribute('href')).toBe('/create/creature/Momie%20royale');

    expect(tuile('Andrak').querySelector('.dw-tuile-marque')).toBeNull();
    expect(tuile('Andrak').querySelector('.dw-tuile__menu button')).toBeNull();
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

  it('trie par rang, de la piétaille au rival', async () => {
    const {noms, choisir} = await rendre();

    await choisir('Trier par', 'Rang');

    expect(noms()).toEqual(['Cathgan', 'Fille de Djidaâ', 'Momie royale', 'Andrak', 'Azhdarkho']);
  });

  it('filtre par rang et par taille, deux listes de la barre de recherche', async () => {
    const {page, noms, choisir} = await rendre();
    expect(page.querySelector('.dw-lr-filtres mat-select')).toBeNull();

    await choisir('Rang', 'Piétaille');
    expect(noms()).toEqual(['Cathgan']);

    await choisir('Rang', 'Tous les rangs');
    await choisir('Taille', 'Moyenne');
    expect(noms()).toEqual(['Fille de Djidaâ', 'Momie royale']);
  });

  it('trie par vitalité, et le bouton du sens l’inverse', async () => {
    const {page, noms, cliquer, choisir} = await rendre();

    await choisir('Trier par', 'Vitalité');
    expect(noms()).toEqual(['Cathgan', 'Momie royale', 'Fille de Djidaâ', 'Andrak', 'Azhdarkho']);

    await cliquer(page.querySelector<HTMLButtonElement>('button.dw-lr-sens')!);
    expect(noms()[0]).toBe('Azhdarkho');
    expect(page.querySelector('button.dw-lr-sens')?.getAttribute('aria-label')).toBe('Ordre décroissant, inverser');
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
    const {page, noms, bouton, cliquer, choisir} = await rendre();
    expect(page.querySelector('.dw-lr-effacer')).toBeNull();

    await cliquer(bouton('.dw-lr-option', 'Mes fiches'));
    await choisir('Rang', 'Coriace');
    expect(page.querySelector('dw-library-toolbar .dw-lr-effacer')).not.toBeNull();
    await cliquer(page.querySelector<HTMLButtonElement>('.dw-lr-effacer')!);

    expect(noms().length).toBe(5);
    expect(page.querySelector('.dw-lr-effacer')).toBeNull();
  });

  it('un clic sur la tuile ouvre le statbloc', async () => {
    const {tuile, open} = await rendre();

    tuile('Andrak').querySelector<HTMLButtonElement>('button.dw-tuile__portrait[aria-label="Andrak, voir son statbloc"]')!.click();

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('sans résultat, le dit', async () => {
    const {page, bouton, cliquer, texte, choisir} = await rendre();

    await cliquer(bouton('.dw-lr-option', 'Mes fiches'));
    await choisir('Rang', 'Piétaille');

    expect(texte(page.querySelector('.dw-lr-vide'))).toBe('Aucune créature ne correspond à ces filtres.');
    expect(page.querySelector('.dw-lr-grille')).toBeNull();
  });
});
