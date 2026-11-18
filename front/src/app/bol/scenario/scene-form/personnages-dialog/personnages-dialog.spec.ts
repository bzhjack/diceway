import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {firstValueFrom} from 'rxjs';
import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {openPersonnagesDialog} from './personnages-dialog';

const DIEU = {id: 'dv', titre: 'Le Dieu voilé'};
const CATALOGUE = [
  {catalogId: 'pnj:p1', kind: 'pnj', sourceId: 'p1', nom: 'Drajit', vitalite: 10, avatar: '', raw: {user_id: null, type: 'R', scenarios: [DIEU]}},
  {catalogId: 'pnj:p2', kind: 'pnj', sourceId: 'p2', nom: 'Aubergiste', vitalite: 8, avatar: '', raw: {user_id: null, type: 'C', scenarios: []}},
  {catalogId: 'creature:c1', kind: 'creature', sourceId: 'c1', nom: 'Loup', vitalite: 5, avatar: '', raw: {user_id: null, rang: 'pietaille', taille: {taille: 'Moyenne', type: 'Animal', deplacement: 'Normal'}, capacites: [], scenarios: [DIEU]}},
] as unknown as CombatCatalogEntry[];

const LOUPS: BolSceneDistributionSaisie = {kind: 'creature', source_id: 'c1', qty: 2, camp: 'adversaires', attitude: 'hostile'};

describe('PersonnagesDialogComponent', () => {
  async function ouvrir(scenarioId: string | null = 'dv', personnages: BolSceneDistributionSaisie[] = [], cible: 'scene' | 'table' = 'scene') {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [{provide: CombatSelectionService, useValue: {catalog: signal(CATALOGUE), loadCatalog: vi.fn(), loading: signal(false), loadFailed: signal(false)}}],
    });
    const ferme = firstValueFrom(openPersonnagesDialog(TestBed.inject(MatDialog), {scenarioId, sceneTitre: 'Le gué', sceneImage: '/assets/bol/gue.webp', sceneAmbiance: 'Le gué, de nuit', personnages, cible}));
    TestBed.tick();
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const noms = () => [...document.querySelectorAll('.pdg-nom')].map((e) => texte(e));
    const panier = () => [...document.querySelectorAll('.pdg-distribution .spe-texte')].map((e) => texte(e));
    const bouton = (libelle: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => texte(b)?.includes(libelle))!;
    const plus = (libelle: string) => document.querySelector<HTMLButtonElement>(`.pdg-tuile-plus[aria-label="${libelle}"]`)!;
    const stable = () => {
      TestBed.tick();
    };
    return {noms, panier, bouton, plus, texte, stable, ferme};
  }

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('s’ouvre sur le scénario de la scène quand il cite des fiches ; « Effacer les filtres » les montre toutes', async () => {
    const {noms, bouton, stable} = await ouvrir();

    expect(noms()).toEqual(['Drajit', 'Loup']);
    bouton('Effacer les filtres').click();
    stable();
    expect(noms()).toEqual(['Aubergiste', 'Drajit', 'Loup']);
  });

  it('filtre par type, chaque option avec son nombre ; un rang se choisit et se rend d’un clic', async () => {
    const {noms, bouton, texte, stable} = await ouvrir(null);

    expect(texte(bouton('Créatures').querySelector('.pdg-type-compte'))).toBe('1');
    bouton('PNJ').click();
    stable();
    expect(noms()).toEqual(['Aubergiste', 'Drajit']);
    const rival = document.querySelector<HTMLButtonElement>('.pdg-rang--R')!;
    rival.click();
    stable();
    expect(noms()).toEqual(['Drajit']);
    rival.click();
    stable();
    expect(noms()).toEqual(['Aubergiste', 'Drajit']);
  });

  it('montre la scène dans son bandeau', async () => {
    const {texte} = await ouvrir();

    expect(texte(document.querySelector('#pdg-titre'))).toBe('Le gué · Le gué, de nuit');
    expect(document.querySelector<HTMLImageElement>('.pdg-bandeau-image')!.getAttribute('src')).toBe('/assets/bol/gue.webp');
  });

  it('« + » fait entrer une fiche dans la distribution ; « Valider » rend la scène entière, ceux d’avant puis les nouveaux', async () => {
    const {panier, plus, bouton, stable, ferme, texte} = await ouvrir(null, [LOUPS]);

    expect(bouton('Valider').disabled).toBe(true);
    plus('Ajouter Drajit').click();
    stable();
    expect(panier()).toEqual(['Loup', 'Drajit']);
    expect(texte(document.querySelectorAll('.pdg-distribution bol-scene-perso')[1].querySelector('.spe-nouveau'))).toBe('nouveau');
    expect(texte(document.querySelector('.pdg-total'))).toBe('3 personnages dans la scène · 1 nouveau');
    bouton('Valider').click();
    stable();

    expect(await ferme).toEqual([LOUPS, {kind: 'pnj', source_id: 'p1', qty: 1, camp: 'adversaires', attitude: null}]);
  });

  it('pour la table, s’ouvre vide et « Ajouter à la table » rend ceux qui entrent, sans marque « nouveau »', async () => {
    const {panier, plus, bouton, stable, ferme, texte} = await ouvrir(null, [], 'table');

    expect(texte(document.querySelector('.pdg-distribution-titre'))).toBe('À ajouter à la table');
    expect(bouton('Ajouter à la table').disabled).toBe(true);
    plus('Ajouter Loup').click();
    stable();
    plus('Un Loup de plus').click();
    stable();
    expect(panier()).toEqual(['Loup']);
    expect(document.querySelector('.pdg-distribution .spe-nouveau')).toBeNull();
    expect(texte(document.querySelector('.pdg-total'))).toBe('2 personnages à ajouter à la table');
    bouton('Ajouter à la table').click();
    stable();

    expect(await ferme).toEqual([{kind: 'creature', source_id: 'c1', qty: 2, camp: 'adversaires', attitude: null}]);
  });

  it('un second clic ajoute un exemplaire, d’une créature comme d’un PNJ', async () => {
    const {plus, stable, texte, bouton, ferme} = await ouvrir(null, [LOUPS, {kind: 'pnj', source_id: 'p1', qty: 1, camp: 'heros', attitude: null}]);

    plus('Un Loup de plus').click();
    plus('Un Drajit de plus').click();
    stable();

    expect(texte(plus('Un Loup de plus').closest('.pdg-tuile')!.querySelector('.pdg-tuile-nombre'))).toBe('×3');
    expect(texte(plus('Un Drajit de plus').closest('.pdg-tuile')!.querySelector('.pdg-tuile-nombre'))).toBe('×2');
    expect([...document.querySelectorAll('.pdg-distribution .spe-nombre')].map((e) => texte(e))).toEqual(['3', '2']);
    bouton('Valider').click();
    stable();
    expect((await ferme)?.map((p) => p.qty)).toEqual([3, 2]);
  });

  it('seul « + » fait entrer une fiche : un clic ailleurs sur la tuile ne change rien', async () => {
    const {panier, plus, stable} = await ouvrir(null);

    plus('Ajouter Loup').closest<HTMLElement>('.pdg-tuile')!.querySelector<HTMLElement>('.pdg-portrait')!.click();
    stable();

    expect(panier()).toEqual([]);
  });

  it('« Voir la fiche » ouvre la statblock de la fiche, sans la faire entrer', async () => {
    const {panier, stable} = await ouvrir(null);
    const open = vi.spyOn(MatDialog.prototype, 'open');

    document.querySelector<HTMLButtonElement>('.pdg-tuile-fiche[aria-label="Voir la fiche de Loup"]')!.click();
    stable();

    expect(open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({panelClass: 'dw-statblock-dialog'}));
    expect(panier()).toEqual([]);
    open.mockRestore();
  });

  it('la distribution règle le camp et retire ; « Annuler » ne change rien', async () => {
    const {panier, bouton, stable, ferme, texte} = await ouvrir(null, [LOUPS]);

    document.querySelector<HTMLButtonElement>('.pdg-distribution .prg-camp-option--heros')!.click();
    stable();
    expect(document.querySelector('.pdg-distribution .spe--allie')).not.toBeNull();
    expect([...document.querySelectorAll('.pdg-camps-texte span')].map((e) => texte(e))).toEqual(['0 adversaire', '2 alliés']);
    document.querySelector<HTMLButtonElement>('.pdg-distribution [aria-label="Retirer Loup"]')!.click();
    stable();
    expect(panier()).toEqual([]);
    expect(bouton('Valider').disabled).toBe(false);
    bouton('Annuler').click();
    stable();

    expect(await ferme).toBeUndefined();
  });

  it('une scène pleine ne prend plus de fiche nouvelle, mais un exemplaire de plus d’une créature déjà là', async () => {
    const pleine = Array.from({length: 60}, (_, i): BolSceneDistributionSaisie => ({...LOUPS, source_id: i === 0 ? 'c1' : `x${i}`}));
    const {plus, texte} = await ouvrir(null, pleine);

    expect(plus('Ajouter Aubergiste').disabled).toBe(true);
    expect(plus('Un Loup de plus').disabled).toBe(false);
    expect(texte(document.querySelector('.pdg-total'))).toContain('la scène est pleine');
  });
});
