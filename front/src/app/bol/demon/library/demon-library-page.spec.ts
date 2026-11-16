import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {BolDemonCategorieModel, BolDemonModel} from '../../models/bol-demon.model';
import {BolFicheScenario} from '../../models/bol-fiche-scenario.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {DemonLibraryPageComponent} from './demon-library-page';

const CATEGORIES: Record<string, BolDemonCategorieModel> = {
  mineur: {id: 1, categorie: 'Mineur', type: 'P', pouvoirs: 1, vitalite: 10, degats: 'd6M'},
  inferieur: {id: 2, categorie: 'Inférieur', type: 'C', pouvoirs: 2, vitalite: 20, degats: 'd6'},
  majeur: {id: 3, categorie: 'Majeur', type: 'R', pouvoirs: 4, vitalite: 30, degats: 'd6B'},
} as Record<string, BolDemonCategorieModel>;
const PERLE: BolFicheScenario = {id: 'pb', titre: 'Perle du Beshaar'};

function demon(nom: string, over: {user?: boolean; categorie?: BolDemonCategorieModel; melee?: number; pouvoirs?: string[]; scenarios?: BolFicheScenario[]} = {}): BolDemonModel {
  const categorie = over.categorie ?? CATEGORIES['inferieur'];
  return {
    id: nom,
    user_id: over.user ? 'moi' : null,
    nom,
    avatar: null,
    commentaire: null,
    vigueur: 0,
    agilite: 0,
    esprit: 0,
    aura: 0,
    vitalite: categorie.vitalite,
    melee: over.melee ?? 1,
    tir: 0,
    defense: 0,
    degats: categorie.degats,
    id_categorie: categorie.id,
    pouvoirs: (over.pouvoirs ?? []).map((p, i) => ({pouvoir: {id: i, pouvoir: p, description: ''}, pouvoir_id: i, demon_id: nom, detail: '', id: i})),
    categorie,
    scenarios: over.scenarios ?? [],
  } as BolDemonModel;
}

const DEMONS = [
  demon('Ilirk', {user: true, categorie: CATEGORIES['majeur'], melee: 3, scenarios: [PERLE]}),
  demon('Diablotin', {categorie: CATEGORIES['mineur'], pouvoirs: ['Invisibilité']}),
  demon('Limier', {user: true, melee: 2, scenarios: [PERLE]}),
];

describe('DemonLibraryPageComponent', () => {
  async function rendre() {
    const open = vi.fn();
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolDemonsService, useValue: {demons: () => of(DEMONS), deleteDemon: vi.fn(() => of({}))}},
        {provide: BolDemonStateService, useValue: {categorieList: signal(Object.values(CATEGORIES))}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: MatDialog, useValue: {open}},
      ],
    });
    const fixture = TestBed.createComponent(DemonLibraryPageComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const noms = () => [...page.querySelectorAll('.dw-lr-grille .dw-tuile__nom')].map((n) => n.textContent?.trim());
    const tuile = (nom: string) => [...page.querySelectorAll('.dw-lr-grille > li')].find((li) => texte(li.querySelector('.dw-tuile__nom')) === nom)!;
    /** Le bouton du filtre en liste de ce titre (« Rang »), dans la barre. */
    const liste = (titre: string) =>
      [...page.querySelectorAll<HTMLButtonElement>('.dw-lr-barre .dw-lr-choix')].find((b) => b.getAttribute('aria-label')?.startsWith(`${titre} : `))!;
    /** Ouvre la liste de ce titre et y choisit l'option qui commence par ce libellé ; la liste se referme. */
    const choisir = async (titre: string, libelle: string) => {
      liste(titre).click();
      await fixture.whenStable();
      [...document.querySelectorAll<HTMLButtonElement>('.dw-lr-menu .dw-lr-option')].find((b) => texte(b)?.startsWith(libelle))!.click();
      await fixture.whenStable();
    };
    const bouton = (selecteur: string, libelle: string) => [...document.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    return {page, fixture, open, texte, noms, tuile, bouton, cliquer, liste, choisir};
  }

  it('montre les démons en tuiles, par nom, avec leur rang et leur vitalité ; les fiches du compte ont la pastille et le menu', async () => {
    const {fixture, noms, tuile, texte} = await rendre();

    expect(noms()).toEqual(['Diablotin', 'Ilirk', 'Limier']);
    expect(texte(tuile('Ilirk').querySelector('.dw-tuile-rang'))).toBe('Rival');
    expect(tuile('Ilirk').querySelector('.dw-tuile-sorte')?.getAttribute('aria-label')).toBe('Démon');
    expect(texte(tuile('Ilirk').querySelector('.dw-tuile__coeur b'))).toBe('30');
    expect(texte(tuile('Ilirk').querySelector('.dw-tuile-marque'))).toBe('Mes fiches');
    expect(tuile('Diablotin').querySelector('.dw-tuile-marque')).toBeNull();
    expect(tuile('Diablotin').querySelector('.dw-tuile__menu button')).toBeNull();

    tuile('Ilirk').querySelector<HTMLButtonElement>('button[aria-label="Actions de Ilirk"]')!.click();
    await fixture.whenStable();
    const items = [...document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item')];
    expect(items.map((i) => texte(i.querySelector('.mat-mdc-menu-item-text')))).toEqual(['Modifier', 'Supprimer']);
    expect(items[0].getAttribute('href')).toBe('/create/demon/Ilirk');
  });

  it('filtre par source et par scénario', async () => {
    const {noms, choisir} = await rendre();

    await choisir('Source', 'Catalogue');
    expect(noms()).toEqual(['Diablotin']);

    await choisir('Source', 'Toutes les sources');
    await choisir('Scénario', 'Perle du Beshaar');
    expect(noms()).toEqual(['Ilirk', 'Limier']);
  });

  it('filtre par catégorie ; une catégorie sans démon n’est pas proposée', async () => {
    const {noms, liste, cliquer, texte, choisir} = await rendre();

    await cliquer(liste('Catégorie'));
    expect([...document.querySelectorAll('.dw-lr-menu .dw-lr-option-label')].map((l) => texte(l))).toEqual(['Toutes les catégories', 'Mineur', 'Inférieur', 'Majeur']);
    await cliquer(liste('Catégorie'));

    await choisir('Catégorie', 'Inférieur');
    expect(noms()).toEqual(['Limier']);
  });

  it('la recherche trouve un pouvoir', async () => {
    const {page, fixture, noms} = await rendre();
    const champ = page.querySelector<HTMLInputElement>('bol-library-barre input')!;

    champ.value = 'invisib';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(noms()).toEqual(['Diablotin']);
  });

  it('un clic sur la tuile ouvre le statbloc', async () => {
    const {tuile, open} = await rendre();

    tuile('Limier').querySelector<HTMLButtonElement>('button.dw-tuile__portrait')!.click();

    expect(open).toHaveBeenCalledTimes(1);
  });
});
