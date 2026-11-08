import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {personnage} from '../../shared/personnage.testing';
import {HeroLibraryPageComponent} from './hero-library-page';

const HEROS: BolHerosModel[] = [
  personnage('Axel', {user: true, joueur: 'Lionel', region: [6, 'Lysor'], vitalite: 12, heroisme: 5, carrieres: [['Voleur', 2]]}),
  personnage('jadawin', {user: true, joueur: 'Marc', region: [3, 'Satarla'], vitalite: 8, heroisme: 5}),
  personnage('Balaram', {user: true, active: false, joueur: 'Sam', region: [6, 'Lysor'], vitalite: 10}),
];

describe('HeroLibraryPageComponent', () => {
  async function rendre() {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolHerosService, useValue: {heroes: () => of(HEROS), deleteHeros: vi.fn(() => of({}))}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: MatDialog, useValue: {open: vi.fn()}},
      ],
    });
    const fixture = TestBed.createComponent(HeroLibraryPageComponent);
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
    return {page, texte, noms, ligne, bouton, cliquer};
  }

  it('liste les héros par nom : joueur, région, statut, carrières', async () => {
    const {noms, ligne, texte} = await rendre();

    expect(noms()).toEqual(['Axel', 'Balaram', 'jadawin']);
    expect(texte(ligne('Axel').querySelector('.hl-joueur'))).toBe('Lionel');
    expect(texte(ligne('Axel').querySelector('.hl-statut'))).toBe('Actif');
    expect(texte(ligne('Balaram').querySelector('.hl-statut'))).toBe('En cours');
    expect(texte(ligne('Axel').querySelector('.hl-carrieres'))).toBe('Voleur 2');
  });

  it('seul un héros en cours de création a l’édition avancée', async () => {
    const {ligne} = await rendre();

    expect(ligne('Balaram').querySelector('a[aria-label="Édition avancée de Balaram"]')?.getAttribute('href')).toBe('/create/hero-advanced/Balaram');
    expect(ligne('Axel').querySelector('a[aria-label^="Édition avancée"]')).toBeNull();
    expect(ligne('Axel').querySelector('button[aria-label="Supprimer Axel"]')).not.toBeNull();
  });

  it('filtre par statut, chaque option avec son nombre de héros', async () => {
    const {noms, bouton, cliquer, texte} = await rendre();

    expect(texte(bouton('.dw-lr-option', 'En cours de création').querySelector('.dw-lr-option-compte'))).toBe('1');
    await cliquer(bouton('.dw-lr-option', 'En cours de création'));

    expect(noms()).toEqual(['Balaram']);
  });

  it('trie par joueur, puis par héroïsme', async () => {
    const {noms, bouton, cliquer} = await rendre();

    await cliquer(bouton('.dw-lr-tri', 'Joueur'));
    expect(noms()).toEqual(['Axel', 'jadawin', 'Balaram']);

    await cliquer(bouton('.dw-lr-tri', 'Hér.'));
    expect(noms()).toEqual(['Balaram', 'Axel', 'jadawin']);
  });
});
