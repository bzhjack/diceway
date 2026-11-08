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

const DIEU_VOILE: BolFicheScenario = {id: 'dv', titre: 'Le Dieu voilé', one_shot: false};

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
    const noms = () => [...page.querySelectorAll('.dw-lr-nom-texte')].map((n) => n.textContent?.trim());
    const ligne = (nom: string) => [...page.querySelectorAll('tbody tr')].find((tr) => texte(tr.querySelector('.dw-lr-nom-texte')) === nom)!;
    const bouton = (selecteur: string, libelle: string) => [...page.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    return {page, fixture, open, texte, noms, ligne, bouton, cliquer};
  }

  it('liste les PNJ par nom : région, type, carrières et source', async () => {
    const {noms, ligne, texte} = await rendre();

    expect(noms()).toEqual(['Acolyte', 'Ajhaskar', 'Archer de Tyrus']);
    expect(texte(ligne('Ajhaskar').querySelector('.pl-region'))).toBe('Lysor');
    expect(texte(ligne('Ajhaskar').querySelector('.pl-type'))).toBe('Rival');
    expect(texte(ligne('Ajhaskar').querySelector('.pl-carrieres'))).toBe('Sorcier 2, Marchand 1');
    expect(texte(ligne('Archer de Tyrus').querySelector('.pl-region'))).toBe('—');
    expect(ligne('Archer de Tyrus').querySelector('.dw-lr-actions')?.children.length).toBe(0);
    expect(ligne('Ajhaskar').querySelector('a[aria-label="Modifier Ajhaskar"]')?.getAttribute('href')).toBe('/create/pnj/Ajhaskar');
  });

  it('filtre par rang et par scénario', async () => {
    const {noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-chip', 'Rival'));
    expect(noms()).toEqual(['Ajhaskar']);

    await cliquer(bouton('.dw-lr-chip', 'Rival'));
    await cliquer(bouton('.dw-lr-option', 'Le Dieu voilé'));
    expect(noms()).toEqual(['Acolyte', 'Ajhaskar']);
  });

  it('trie par vitalité', async () => {
    const {noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-tri', 'Vit.'));

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
