import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {BolFicheScenario} from '../../models/bol-fiche-scenario.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolPnjService} from '../../services/bol-pnj.service';
import {personnage} from '../../shared/personnage.testing';
import {PnjLibraryPageComponent} from './pnj-library-page';

const DIEU_VOILE: BolFicheScenario = {id: 'dv', titre: 'Le Dieu voilé'};

const PNJS: BolHerosModel[] = [
  personnage('Ajhaskar', {type: 'R', user: true, region: [6, 'Lysor'], vitalite: 11, carrieres: [['Sorcier', 2], ['Marchand', 1]], scenarios: [DIEU_VOILE]}),
  personnage('Archer de Tyrus', {type: 'C', vitalite: 5}),
  personnage('Acolyte', {type: 'P', user: true, region: [3, 'Satarla'], vitalite: 2, scenarios: [DIEU_VOILE]}),
];

describe('PnjLibraryPageComponent', () => {
  async function rendre() {
    const open = vi.fn();
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolPnjService, useValue: {pnjs: () => of(PNJS), deletePnj: vi.fn(() => of({}))}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: MatDialog, useValue: {open}},
      ],
    });
    const fixture = TestBed.createComponent(PnjLibraryPageComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const noms = () => [...page.querySelectorAll('.dw-lr-grille .dw-tuile__nom')].map((n) => n.textContent?.trim());
    const tuile = (nom: string) => [...page.querySelectorAll('.dw-lr-grille > li')].find((li) => texte(li.querySelector('.dw-tuile__nom')) === nom)!;
    /** Ouvre la liste de ce nom, dans la barre de recherche, et y choisit l'option qui commence par ce libellé. */
    const choisir = async (liste: string, libelle: string) => {
      page.querySelector<HTMLElement>(`dw-library-toolbar mat-select[aria-label="${liste}"] .mat-mdc-select-trigger`)!.click();
      await fixture.whenStable();
      [...document.querySelectorAll<HTMLElement>('mat-option')].find((o) => o.textContent?.trim().startsWith(libelle))!.click();
      await fixture.whenStable();
    };
    const bouton = (selecteur: string, libelle: string) => [...page.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    return {page, fixture, open, texte, noms, tuile, bouton, cliquer, choisir};
  }

  it('montre les PNJ en tuiles, par nom, avec leur rang et leur vitalité ; les fiches du compte ont la pastille et le menu', async () => {
    const {fixture, noms, tuile, texte} = await rendre();

    expect(noms()).toEqual(['Acolyte', 'Ajhaskar', 'Archer de Tyrus']);
    expect(texte(tuile('Ajhaskar').querySelector('.dw-tuile-rang'))).toBe('Rival');
    expect(tuile('Ajhaskar').querySelector('.dw-tuile-sorte')?.getAttribute('aria-label')).toBe('PNJ');
    expect(texte(tuile('Ajhaskar').querySelector('.dw-tuile__coeur b'))).toBe('11');
    expect(texte(tuile('Ajhaskar').querySelector('.dw-tuile-marque'))).toBe('Mes fiches');
    expect(tuile('Archer de Tyrus').querySelector('.dw-tuile-marque')).toBeNull();
    expect(tuile('Archer de Tyrus').querySelector('.dw-tuile__menu button')).toBeNull();

    tuile('Ajhaskar').querySelector<HTMLButtonElement>('button[aria-label="Actions de Ajhaskar"]')!.click();
    await fixture.whenStable();
    expect(document.querySelector('.mat-mdc-menu-item')?.getAttribute('href')).toBe('/create/pnj/Ajhaskar');
  });

  it('filtre par rang et par région, deux listes à droite de la recherche, puis par scénario', async () => {
    const {page, texte, noms, bouton, cliquer, choisir} = await rendre();

    expect(page.querySelector('.dw-lr-filtres .dw-lr-effacer')).toBeNull();
    expect(page.querySelector('.dw-lr-filtres mat-select')).toBeNull();

    expect(texte(page.querySelector('dw-library-toolbar dw-tag'))).toBe('3 PNJ');

    await choisir('Rang', 'Rival');
    expect(noms()).toEqual(['Ajhaskar']);
    expect(texte(page.querySelector('dw-library-toolbar dw-tag'))).toBe('1 PNJ');
    expect(page.querySelector('dw-library-toolbar .dw-lr-effacer')).not.toBeNull();

    await choisir('Rang', 'Tous les rangs');
    await choisir('Région', 'Satarla');
    expect(noms()).toEqual(['Acolyte']);

    await choisir('Région', 'Toutes les régions');
    await cliquer(bouton('.dw-lr-option', 'Le Dieu voilé'));
    expect(noms()).toEqual(['Acolyte', 'Ajhaskar']);
  });

  it('trie par vitalité', async () => {
    const {noms, choisir} = await rendre();

    await choisir('Trier par', 'Vitalité');

    expect(noms()).toEqual(['Acolyte', 'Archer de Tyrus', 'Ajhaskar']);
  });

  it('la recherche trouve une carrière', async () => {
    const {page, fixture, noms} = await rendre();
    const champ = page.querySelector<HTMLInputElement>('dw-library-toolbar input')!;

    champ.value = 'sorcier';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(noms()).toEqual(['Ajhaskar']);
  });
});
