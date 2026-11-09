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
    const noms = () => [...page.querySelectorAll('.dw-lr-nom-texte')].map((n) => n.textContent?.trim());
    const ligne = (nom: string) => [...page.querySelectorAll('tbody tr')].find((tr) => texte(tr.querySelector('.dw-lr-nom-texte')) === nom)!;
    const bouton = (selecteur: string, libelle: string) => [...page.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    return {page, fixture, open, texte, noms, ligne, bouton, cliquer};
  }

  it('liste les démons par nom, avec leur catégorie, leur type et leur source', async () => {
    const {noms, ligne, texte} = await rendre();

    expect(noms()).toEqual(['Diablotin', 'Ilirk', 'Limier']);
    expect(texte(ligne('Ilirk').querySelector('.dl-categorie'))).toBe('Majeur');
    expect(texte(ligne('Ilirk').querySelector('.dl-type'))).toBe('Rival');
    expect([...ligne('Ilirk').querySelector('.dw-lr-source')!.children].map((e) => texte(e))).toEqual(['Mes fiches', 'Perle du Beshaar']);
    expect(ligne('Diablotin').querySelector('.dw-lr-actions')?.children.length).toBe(0);
  });

  it('filtre par source et par scénario', async () => {
    const {noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-option', 'Catalogue commun'));
    expect(noms()).toEqual(['Diablotin']);

    await cliquer(bouton('.dw-lr-option', 'Tous les démons'));
    await cliquer(bouton('.dw-lr-option', 'Perle du Beshaar'));
    expect(noms()).toEqual(['Ilirk', 'Limier']);
  });

  it('trie par mêlée, puis dans l’autre sens', async () => {
    const {noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-tri', 'Mêlée'));
    expect(noms()).toEqual(['Diablotin', 'Limier', 'Ilirk']);
    await cliquer(bouton('.dw-lr-tri', 'Mêlée'));
    expect(noms()).toEqual(['Ilirk', 'Limier', 'Diablotin']);
  });

  it('la recherche trouve un pouvoir', async () => {
    const {page, fixture, noms} = await rendre();
    const champ = page.querySelector<HTMLInputElement>('dw-library-toolbar input')!;

    champ.value = 'invisib';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(noms()).toEqual(['Diablotin']);
  });

  it('un clic sur le nom ouvre le statbloc', async () => {
    const {ligne, open} = await rendre();

    ligne('Limier').querySelector<HTMLButtonElement>('.dw-lr-nom')!.click();

    expect(open).toHaveBeenCalledTimes(1);
  });
});
