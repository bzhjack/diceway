import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {firstValueFrom} from 'rxjs';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {openPersonnagesDialog} from './personnages-dialog';

const DIEU = {id: 'dv', titre: 'Le Dieu voilé'};
const CATALOGUE = [
  {catalogId: 'pnj:p1', kind: 'pnj', sourceId: 'p1', nom: 'Drajit', vitalite: 10, avatar: '', raw: {user_id: null, type: 'R', scenarios: [DIEU]}},
  {catalogId: 'pnj:p2', kind: 'pnj', sourceId: 'p2', nom: 'Aubergiste', vitalite: 8, avatar: '', raw: {user_id: null, type: 'C', scenarios: []}},
  {catalogId: 'creature:c1', kind: 'creature', sourceId: 'c1', nom: 'Loup', vitalite: 5, avatar: '', raw: {user_id: null, rang: 'pietaille', scenarios: [DIEU]}},
] as unknown as CombatCatalogEntry[];

describe('PersonnagesDialogComponent', () => {
  async function ouvrir(scenarioId: string | null = 'dv', pnjsEnScene = new Set<string>()) {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [{provide: CombatSelectionService, useValue: {catalog: signal(CATALOGUE), loadCatalog: vi.fn(), loading: signal(false), loadFailed: signal(false)}}],
    });
    const ferme = firstValueFrom(openPersonnagesDialog(TestBed.inject(MatDialog), {scenarioId, pnjsEnScene}));
    TestBed.tick();
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const noms = () => [...document.querySelectorAll('.pdg-nom')].map((e) => texte(e));
    const bouton = (libelle: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => texte(b)?.includes(libelle))!;
    const stable = () => {
      TestBed.tick();
    };
    return {noms, bouton, texte, stable, ferme};
  }

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('s’ouvre sur le scénario de la scène quand il cite des fiches ; « Effacer les filtres » les montre toutes', async () => {
    const {noms, bouton, stable} = await ouvrir();

    expect(noms()).toEqual(['Drajit', 'Loup']);
    bouton('Effacer les filtres').click();
    stable();
    expect(noms()).toEqual(['Aubergiste', 'Drajit', 'Loup']);
  });

  it('filtre par type, chaque option avec son nombre', async () => {
    const {noms, bouton, texte, stable} = await ouvrir(null);

    expect(texte(bouton('Créatures').querySelector('.dw-lr-option-compte'))).toBe('1');
    bouton('PNJ').click();
    stable();
    expect(noms()).toEqual(['Aubergiste', 'Drajit']);
  });

  it('un clic choisit une fiche, un second la rend ; « Ajouter à la scène » rend les fiches choisies', async () => {
    const {bouton, stable, ferme} = await ouvrir(null);
    const carte = (nom: string) => bouton(nom);

    carte('Loup').click();
    carte('Drajit').click();
    carte('Drajit').click();
    stable();
    expect(carte('Loup').getAttribute('aria-pressed')).toBe('true');
    bouton('Ajouter à la scène').click();
    stable();

    expect(((await ferme) ?? []).map((f) => f.nom)).toEqual(['Loup']);
  });

  it('un PNJ déjà en scène ne se choisit pas une seconde fois', async () => {
    const {bouton} = await ouvrir(null, new Set(['pnj:p1']));

    expect(bouton('Drajit').disabled).toBe(true);
    expect(bouton('Drajit').textContent).toContain('Déjà en scène');
  });
});
