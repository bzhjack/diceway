import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, convertToParamMap, Router} from '@angular/router';
import {Component, input} from '@angular/core';
import {of} from 'rxjs';
import {BolFightSessionModel} from '../../models/bol-fight-session.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {DiceBoxHostComponent} from '../../../shared/dice-3d/dice-box-host';
import {StartCombatPageComponent} from './start-combat-page';

/** Le plateau de dés 3D charge un moteur : hors sujet ici, les jets se tapent. */
@Component({selector: 'app-dice-box-host', template: ''})
class DiceBoxStubComponent {
  readonly scale = input(8);
  readonly themeColor = input('');
  readonly theme = input('');
}

function fiche(id: string, nom: string, agilite: number): BolHerosModel {
  return {
    id,
    origines: {nom, joueur: 'Clara', avatar: null, region_id: null, langues: []},
    attributs: {vigueur: 1, agilite, agilite_effective: agilite, esprit: 1, aura: 0},
    combat: {initiative: 1, initiative_effective: 1, melee: 1, tir: 0, defense: 1, defense_effective: 1},
    ressources: {vitalite: 10, heroisme: 2, experience: 0, pouvoir: 0, foi: 0, creation: 0},
    armes: [],
    armures: [],
    carrieres: [],
    traits: [],
  } as unknown as BolHerosModel;
}

const FICHES: Record<string, BolHerosModel> = {h1: fiche('h1', 'Grimar', 1), h2: fiche('h2', 'Axel', 3)};

function session(over: Partial<BolFightSessionModel> = {}): BolFightSessionModel {
  return {
    id: 's1',
    titre: 'Table',
    statut: 'libre',
    heros: [
      {id: 1, fight_session_id: 's1', heros_id: 'h1', camp: 'heros', initiative_resultat: null, vitalite_courante: 10},
      {id: 2, fight_session_id: 's1', heros_id: 'h2', camp: 'heros', initiative_resultat: null, vitalite_courante: 10},
    ],
    creatures: [],
    demons: [],
    pnjs: [{id: 7, pnj_id: 'p7', camp: 'adversaires', rang: 'coriace', nom: 'Kalzatan', surnom: null, initiative: 1, vitalite_max: 10, vitalite_courante: 10, armes: []}],
    ...over,
  } as unknown as BolFightSessionModel;
}

describe('StartCombatPageComponent', () => {
  let fixture: ComponentFixture<StartCombatPageComponent>;
  let element: HTMLElement;
  const updateHeroInitiative = vi.fn((_session: string, pivot: number, resultat: string | null) => of({id: pivot, resultat}));
  const startCombat = vi.fn(() => of(session({statut: 'combat', etat_combat: {round: 1, joues: []}})));
  const navigate = vi.fn(() => Promise.resolve(true));

  async function rendre(chargee: BolFightSessionModel, queryParams: Record<string, string> = {}): Promise<void> {
    updateHeroInitiative.mockClear();
    startCombat.mockClear();
    navigate.mockClear();
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: convertToParamMap({id: 's1'}), queryParamMap: convertToParamMap(queryParams)}}},
        {provide: Router, useValue: {navigate, navigateByUrl: navigate}},
        {provide: MatDialog, useValue: {open: vi.fn()}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: BolFightSessionService, useValue: {fightSession: () => of(chargee), updateHeroInitiative, startCombat, updateCombatState: vi.fn(() => of(chargee))}},
        {provide: BolHerosService, useValue: {heros: (id: string) => of(FICHES[id])}},
      ],
    });
    TestBed.overrideComponent(StartCombatPageComponent, {remove: {imports: [DiceBoxHostComponent]}, add: {imports: [DiceBoxStubComponent]}});
    fixture = TestBed.createComponent(StartCombatPageComponent);
    element = fixture.nativeElement as HTMLElement;
    await stable();
  }

  async function stable(): Promise<void> {
    await fixture.whenStable();
    TestBed.tick();
    await fixture.whenStable();
  }

  const texte = () => (element.textContent ?? '').replace(/\s+/g, ' ');
  const totaux = () => [...element.querySelectorAll<HTMLInputElement>('input.scd-total')];
  const boutonDemarrer = () => [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) => /Commencer le combat|Valider la réaction/.test(b.textContent ?? ''))!;

  async function saisir(index: number, valeur: string): Promise<void> {
    const input = totaux()[index];
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
    await stable();
  }

  it('range les héros par agilité décroissante, et attend le jet de chacun', async () => {
    await rendre(session());

    expect(totaux().length).toBe(2);
    expect(texte().indexOf('Axel')).toBeLessThan(texte().indexOf('Grimar'));
    expect(boutonDemarrer().disabled).toBe(true);
    expect(texte()).toContain('Lancer pour tous');
  });

  it('enregistre chaque jet, et démarre une fois tous les jets faits', async () => {
    await rendre(session());

    await saisir(0, '9');
    expect(boutonDemarrer().disabled).toBe(true);
    await saisir(1, '8');

    expect(updateHeroInitiative).toHaveBeenCalledTimes(2);
    expect(boutonDemarrer().disabled).toBe(false);

    boutonDemarrer().click();
    await stable();

    expect(startCombat).toHaveBeenCalledWith('s1', []);
    expect(navigate).toHaveBeenCalled();
  });

  it('un double 1 rate (l’échec critique reste au choix du joueur), un double 6 donne un succès héroïque', async () => {
    await rendre(session());

    await saisir(0, '2');
    await saisir(1, '12');

    expect(updateHeroInitiative.mock.calls.map((call) => call[2])).toEqual(['echec', 'heroique']);
  });

  it('un jet effacé redevient à faire', async () => {
    await rendre(session());
    await saisir(0, '9');

    await saisir(0, '');

    expect(texte()).toContain('Lancer pour tous');
    expect(updateHeroInitiative.mock.calls.at(-1)?.[2]).toBeNull();
  });

  it('ne démarre pas sans adversaire', async () => {
    await rendre(session({pnjs: []}));

    await saisir(0, '9');
    await saisir(1, '8');

    expect(boutonDemarrer().disabled).toBe(true);
  });

  it('efface un résultat resté d’un combat précédent', async () => {
    const ancienne = session();
    ancienne.heros![0].initiative_resultat = 'reussite';
    await rendre(ancienne);

    expect(updateHeroInitiative).toHaveBeenCalledWith('s1', 1, null);
    expect(texte()).toContain('Lancer pour tous');
  });

  it('un nouveau jet en plein combat garde hors du combat les cartes retirées et les rivaux enfuis', async () => {
    const enCombat = session({
      statut: 'combat',
      etat_combat: {round: 3, joues: [], effets: [], exclus: ['pnj-7', 'pnj-8'], fuis: ['pnj-8']},
      pnjs: [
        {id: 7, pnj_id: 'p7', camp: 'adversaires', rang: 'coriace', nom: 'Kalzatan', surnom: null, initiative: 1, vitalite_max: 10, vitalite_courante: 10, armes: []},
        {id: 8, pnj_id: 'p8', camp: 'adversaires', rang: 'rival', nom: 'Thuran', surnom: null, initiative: 1, vitalite_max: 10, vitalite_courante: 10, armes: []},
        {id: 9, pnj_id: 'p9', camp: 'adversaires', rang: 'coriace', nom: 'Garde', surnom: null, initiative: 0, vitalite_max: 10, vitalite_courante: 10, armes: []},
      ],
    } as unknown as Partial<BolFightSessionModel>);
    await rendre(enCombat, {reroll: '1'});

    await saisir(0, '9');
    await saisir(1, '8');
    boutonDemarrer().click();
    await stable();

    expect(startCombat).toHaveBeenCalledWith('s1', ['pnj-7', 'pnj-8']);
  });

  it('une session déjà en combat renvoie à la table, sauf pour un nouveau jet', async () => {
    await rendre(session({statut: 'combat'}));
    expect(navigate).toHaveBeenCalled();

    TestBed.resetTestingModule();
    await rendre(session({statut: 'combat'}), {reroll: '1'});
    expect(navigate).not.toHaveBeenCalled();
    expect(totaux().length).toBe(2);
  });
});
