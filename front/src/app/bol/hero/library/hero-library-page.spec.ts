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
    /** Ouvre le menu `⋯` de ce héros et rend le libellé et le lien de chacune de ses actions. */
    const actions = async (nom: string) => {
      tuile(nom).querySelector<HTMLButtonElement>(`button[aria-label="Actions de ${nom}"]`)!.click();
      await fixture.whenStable();
      return [...document.querySelectorAll<HTMLElement>('.mat-mdc-menu-item')].map((i) => [texte(i.querySelector('.mat-mdc-menu-item-text')), i.getAttribute('href')]);
    };
    const bouton = (selecteur: string, libelle: string) => [...document.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
    return {page, fixture, texte, noms, tuile, bouton, cliquer, liste, choisir, actions};
  }

  it('montre les héros en tuiles, par nom : joueur, héroïsme et vitalité dans le pied, « En cours » pour un héros pas encore actif', async () => {
    const {page, noms, tuile, texte} = await rendre();

    expect(page.querySelector('table')).toBeNull();
    expect(noms()).toEqual(['Axel', 'Balaram', 'jadawin']);
    expect(texte(tuile('Axel').querySelector('.dw-tuile__sous'))).toBe('Lionel');
    expect(texte(tuile('Axel').querySelector('.dw-tuile__pied .dw-tuile__ecusson b'))).toBe('5');
    expect(texte(tuile('Axel').querySelector('.dw-tuile__pied .dw-tuile__coeur b'))).toBe('12');
    expect(tuile('Axel').querySelector('.dw-tuile-marque')).toBeNull();
    expect(texte(tuile('Balaram').querySelector('.dw-tuile-marque'))).toBe('En cours');
    expect(tuile('Balaram').querySelector('.dw-tuile__pied .dw-tuile__ecusson')).not.toBeNull();
    expect(texte(page.querySelector('.dw-lr-barre .dw-lr-nombre'))).toBe('3 héros');
  });

  it('seul un héros en cours de création a l’édition avancée dans son menu', async () => {
    const {actions} = await rendre();

    expect(await actions('Balaram')).toEqual([
      ['Modifier', '/create/hero/Balaram'],
      ['Édition avancée', '/create/hero-advanced/Balaram'],
      ['Supprimer', null],
    ]);
  });

  it('un héros actif se modifie et se supprime', async () => {
    const {actions} = await rendre();

    expect(await actions('Axel')).toEqual([
      ['Modifier', '/create/hero/Axel'],
      ['Supprimer', null],
    ]);
  });

  it('filtre par statut dans une liste, chaque option avec son nombre de héros', async () => {
    const {page, noms, cliquer, texte, liste, choisir} = await rendre();

    expect(page.querySelector('.dw-lr-seg-option')).toBeNull();
    await cliquer(liste('Statut'));
    const options = [...document.querySelectorAll('.dw-lr-menu .dw-lr-option')].map((o) => [texte(o.querySelector('.dw-lr-option-label')), texte(o.querySelector('.dw-lr-option-compte'))]);
    expect(options).toEqual([['Tous les héros', '3'], ['Actifs', '2'], ['En cours de création', '1']]);
    await cliquer(liste('Statut'));

    await choisir('Statut', 'En cours de création');
    expect(noms()).toEqual(['Balaram']);
    expect(texte(liste('Statut').querySelector('.dw-lr-choix-valeur'))).toBe('En cours de création');
  });

  it('filtre par région, dans sa liste', async () => {
    const {page, noms, liste, choisir, texte} = await rendre();

    await choisir('Région', 'Lysor');

    expect(noms()).toEqual(['Axel', 'Balaram']);
    expect(texte(liste('Région').querySelector('.dw-lr-choix-valeur'))).toBe('Lysor');
    expect(texte(page.querySelector('.dw-lr-barre .dw-lr-nombre'))).toBe('2 sur 3 héros');
  });

});
