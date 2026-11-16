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
      [...document.querySelectorAll<HTMLButtonElement>(selecteur)].find((b) => texte(b)?.startsWith(libelle))!;
    const cliquer = async (b: HTMLElement) => {
      b.click();
      await fixture.whenStable();
    };
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
    return {page, fixture, open, texte, noms, tuile, bouton, cliquer, liste, choisir};
  }

  it('montre toutes les créatures en tuiles, par nom, avec leur rang, leur sorte et leur vitalité', async () => {
    const {page, noms, tuile, texte} = await rendre();

    expect(page.querySelector('table')).toBeNull();
    expect(noms()).toEqual(['Andrak', 'Azhdarkho', 'Cathgan', 'Fille de Djidaâ', 'Momie royale']);
    expect(texte(tuile('Cathgan').querySelector('.dw-tuile-rang'))).toBe('Piétaille');
    expect(tuile('Cathgan').querySelector('.dw-tuile-sorte')?.getAttribute('aria-label')).toBe('Créature');
    expect(texte(tuile('Cathgan').querySelector('.dw-tuile__coeur b'))).toBe('2');
    expect(texte(page.querySelector('.dw-lr-barre .dw-lr-nombre'))).toBe('5 créatures');
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

  it('filtre par source dans une liste, comme les autres filtres, chaque option avec son nombre de créatures', async () => {
    const {page, noms, texte, liste, cliquer, choisir} = await rendre();

    expect(page.querySelector('.dw-lr-seg-option')).toBeNull();
    expect(texte(liste('Source').querySelector('.dw-lr-choix-valeur'))).toBe('Source');
    await cliquer(liste('Source'));
    const options = [...document.querySelectorAll('.dw-lr-menu .dw-lr-option')].map((o) => [texte(o.querySelector('.dw-lr-option-label')), texte(o.querySelector('.dw-lr-option-compte'))]);
    expect(options).toEqual([['Toutes les sources', '5'], ['Catalogue', '3'], ['Mes fiches', '2']]);
    await cliquer(liste('Source'));

    await choisir('Source', 'Mes fiches');
    expect(noms()).toEqual(['Fille de Djidaâ', 'Momie royale']);
    expect(texte(liste('Source').querySelector('.dw-lr-choix-valeur'))).toBe('Mes fiches');
    expect(liste('Source').classList).toContain('dw-lr-choix--pose');
  });

  it('filtre par scénario, catalogue compris, à la teinte de chaque saga ; un second clic le retire', async () => {
    const {noms, bouton, cliquer, texte, liste, choisir} = await rendre();
    await cliquer(liste('Scénario'));
    const dieuVoile = bouton('.dw-lr-menu .dw-lr-option', 'Le Dieu voilé');

    expect(texte(bouton('.dw-lr-menu .dw-lr-option', 'Tous les scénarios').querySelector('.dw-lr-option-compte'))).toBe('5');
    expect(texte(dieuVoile.querySelector('.dw-lr-option-compte'))).toBe('2');
    expect(dieuVoile.classList).toContain('dw-saga--1');
    expect(bouton('.dw-lr-menu .dw-lr-option', 'Perle du Beshaar').classList).toContain('dw-saga--2');
    await cliquer(dieuVoile);
    expect(noms()).toEqual(['Azhdarkho', 'Momie royale']);
    expect(document.querySelector('.dw-lr-menu')).toBeNull();
    expect(texte(liste('Scénario').querySelector('.dw-lr-choix-valeur'))).toBe('Le Dieu voilé');

    await choisir('Scénario', 'Le Dieu voilé');
    expect(noms().length).toBe(5);
    expect(texte(liste('Scénario').querySelector('.dw-lr-choix-valeur'))).toBe('Scénario');
  });

  it('filtre par rang et par taille, chacun dans sa liste ; « Tous les rangs » retire le rang', async () => {
    const {page, noms, liste, choisir} = await rendre();
    expect(page.querySelector('mat-select')).toBeNull();

    await choisir('Rang', 'Piétaille');
    expect(noms()).toEqual(['Cathgan']);

    await choisir('Rang', 'Tous les rangs');
    expect(noms()).toHaveLength(5);
    expect(liste('Rang').classList).not.toContain('dw-lr-choix--pose');
    await choisir('Taille', 'Moyenne');
    expect(noms()).toEqual(['Fille de Djidaâ', 'Momie royale']);
  });

  it('la recherche trouve aussi une capacité ou un scénario', async () => {
    const {page, noms, fixture} = await rendre();
    const champ = page.querySelector<HTMLInputElement>('bol-library-barre input')!;

    champ.value = 'rugiss';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(noms()).toEqual(['Andrak']);

    champ.value = 'perle';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(noms()).toEqual(['Cathgan', 'Fille de Djidaâ']);
  });

  it('« Effacer les filtres » est toujours là, désactivé sans filtre ; avec un filtre, il les retire tous', async () => {
    const {page, noms, cliquer, choisir} = await rendre();
    const effacer = () => page.querySelector<HTMLButtonElement>('.dw-lr-barre .dw-lr-effacer')!;
    expect(effacer().getAttribute('aria-disabled')).toBe('true');

    await choisir('Source', 'Mes fiches');
    await choisir('Rang', 'Coriace');
    expect(effacer().getAttribute('aria-disabled')).not.toBe('true');
    await cliquer(effacer());

    expect(noms().length).toBe(5);
    expect(effacer().getAttribute('aria-disabled')).toBe('true');
  });

  it('un clic sur la tuile ouvre le statbloc', async () => {
    const {tuile, open} = await rendre();

    tuile('Andrak').querySelector<HTMLButtonElement>('button.dw-tuile__portrait[aria-label="Andrak, voir son statbloc"]')!.click();

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('l’en-tête dit le total, la barre le compte ; un filtre posé se voit sur son bouton, bordé d’or, et nulle part ailleurs', async () => {
    const {page, texte, liste, choisir} = await rendre();

    expect(texte(page.querySelector('.dw-lr-entete .dw-lr-compte'))).toBe('5 créatures');
    expect(texte(page.querySelector('.dw-lr-barre .dw-lr-nombre'))).toBe('5 créatures');
    expect(texte(liste('Rang').querySelector('.dw-lr-choix-valeur'))).toBe('Rang');
    expect(liste('Rang').getAttribute('aria-label')).toBe('Rang : Tous les rangs');

    await choisir('Source', 'Mes fiches');
    await choisir('Rang', 'Coriace');

    expect(texte(page.querySelector('.dw-lr-entete .dw-lr-compte'))).toBe('5 créatures');
    expect(texte(page.querySelector('.dw-lr-barre .dw-lr-nombre'))).toBe('2 sur 5 créatures');
    expect(texte(liste('Rang').querySelector('.dw-lr-choix-valeur'))).toBe('Coriace');
    expect(liste('Rang').getAttribute('aria-label')).toBe('Rang : Coriace');
    expect(liste('Rang').classList).toContain('dw-lr-choix--pose');
    expect(liste('Taille').classList).not.toContain('dw-lr-choix--pose');
    expect(page.querySelector('.dw-lr-pastille, .dw-lr-filtrer')).toBeNull();
  });

  it('sans résultat, le dit', async () => {
    const {page, texte, choisir} = await rendre();

    await choisir('Source', 'Mes fiches');
    await choisir('Rang', 'Piétaille');

    expect(texte(page.querySelector('.dw-lr-vide'))).toBe('Aucune créature ne correspond à ces filtres.');
    expect(page.querySelector('.dw-lr-grille')).toBeNull();
  });
});
