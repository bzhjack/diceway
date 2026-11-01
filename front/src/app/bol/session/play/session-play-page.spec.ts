import {signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ActivatedRoute, convertToParamMap, Router} from '@angular/router';
import {EMPTY, of} from 'rxjs';
import {BolFightSessionModel, EtatCombatDto} from '../../models/bol-fight-session.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolCombatReferenceService} from '../../services/bol-combat-reference.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolPnjService} from '../../services/bol-pnj.service';
import {BolSceneService} from '../../services/bol-scene.service';
import {CombatSelectionService} from '../../services/combat-selection.service';
import {SceneActionsService} from '../scene-actions.service';
import {TableChange} from '../models/table-change.model';
import {TapisCard} from '../models/tapis.model';
import {SessionPlayPageComponent} from './session-play-page';
import {SceneStageStore} from './theatre/scene-stage.store';

function heroRow(id: number, vitalite: number) {
  return {
    id,
    fight_session_id: 's1',
    heros_id: `h${id}`,
    camp: 'heros',
    initiative_resultat: 'reussite',
    vitalite_courante: vitalite,
    heros: {
      id: `h${id}`,
      origines: {nom: `Héros ${id}`, avatar: null, joueur: 'Clara'},
      attributs: {agilite: 3 - id, agilite_effective: 3 - id},
      ressources: {vitalite: 10, heroisme: 2},
      combat: {defense: 1, defense_effective: 1},
      armes: [],
    },
  };
}

function pnjRow(id: number, vitalite: number, camp = 'adversaires') {
  return {id, pnj_id: `p${id}`, camp, rang: 'coriace', nom: `PNJ ${id}`, surnom: null, initiative: 0, vitalite_max: 10, vitalite_courante: vitalite, degats: 'd6', defense: 1, armes: [], pnj: null};
}

function etat(over: Partial<EtatCombatDto> = {}): EtatCombatDto {
  return {round: 1, joues: [], effets: [], exclus: [], ...over};
}

function session(over: Partial<BolFightSessionModel> = {}): BolFightSessionModel {
  return {
    id: 's1',
    titre: 'Table',
    statut: 'combat',
    etat_combat: etat(),
    heros: [heroRow(1, 10), heroRow(2, 10)],
    pnjs: [pnjRow(7, 10)],
    creatures: [],
    demons: [],
    ...over,
  } as unknown as BolFightSessionModel;
}

/** Ce que la page expose à son gabarit : la spécification la conduit comme lui. */
interface PageApi {
  session: ReturnType<typeof signal<BolFightSessionModel | null>>;
  loading: () => boolean;
  errorMessage: () => string | null;
  mode: () => string;
  activeCard: () => TapisCard | null;
  cards: () => readonly TapisCard[];
  etat: () => {round: number; joues: readonly string[]};
  onEndTurn(afterHit?: boolean): void;
  onDelay(): void;
  onTableChanged(change: TableChange): void;
  toggleCamp(card: TapisCard): void;
  onHitApplied(hit: {target: TapisCard; damage: number; unarmed: boolean}): void;
}

describe('SessionPlayPageComponent', () => {
  let fixture: ComponentFixture<SessionPlayPageComponent>;
  let page: PageApi;
  const service = {
    fightSession: vi.fn(),
    updateCombatState: vi.fn(),
    applyDamage: vi.fn(),
    setCamp: vi.fn(),
    removeCombatant: vi.fn(),
  };
  const dialogOpen = vi.fn();

  async function rendre(chargee: BolFightSessionModel | null, id: string | null = 's1'): Promise<void> {
    Object.values(service).forEach((mock) => mock.mockReset());
    dialogOpen.mockReset();
    dialogOpen.mockReturnValue({afterClosed: () => EMPTY});
    service.fightSession.mockReturnValue(chargee ? of(chargee) : EMPTY);
    service.updateCombatState.mockImplementation((_id: string, next: EtatCombatDto) => of({...chargee, etat_combat: next}));
    service.applyDamage.mockImplementation(() => of(chargee));
    TestBed.configureTestingModule({
      providers: [
        {provide: ActivatedRoute, useValue: {snapshot: {paramMap: convertToParamMap(id ? {id} : {})}}},
        {provide: Router, useValue: {navigate: vi.fn(), navigateByUrl: vi.fn()}},
        {provide: MatDialog, useValue: {open: dialogOpen, openDialogs: [], afterAllClosed: EMPTY}},
        {provide: MatSnackBar, useValue: {open: vi.fn(() => ({afterDismissed: () => EMPTY}))}},
        {provide: BolFightSessionService, useValue: service},
        {provide: BolHerosService, useValue: {heros: vi.fn((herosId: string) => of({id: herosId, origines: {nom: herosId, langues: []}, attributs: {}, combat: {}, ressources: {heroisme: 2}, equipement_effectif: {}, armes: [], armures: [], carrieres: [], traits: []} as unknown as BolHerosModel)), adjustHeroisme: vi.fn(() => EMPTY)}},
        {provide: BolPnjService, useValue: {}},
        {provide: BolCreaturesService, useValue: {}},
        {provide: BolDemonsService, useValue: {}},
        {provide: CombatSelectionService, useValue: {catalog: signal([])}},
        {provide: BolSceneService, useValue: {scenes: () => EMPTY}},
        {provide: SceneActionsService, useValue: {}},
        {provide: BolCombatReferenceService, useValue: {getCombatOptions: () => of([])}},
      ],
    });
    // Le gabarit a ses propres tests : ici, la page seule, avec ce qu'elle enregistre et recharge.
    TestBed.overrideComponent(SessionPlayPageComponent, {
      set: {imports: [], template: '', providers: [{provide: SceneStageStore, useValue: {sync: vi.fn(), reload: vi.fn(), rideau: signal(null), carton: signal(null)}}]},
    });
    fixture = TestBed.createComponent(SessionPlayPageComponent);
    page = fixture.componentInstance as unknown as PageApi;
    await stable();
  }

  async function stable(): Promise<void> {
    TestBed.tick();
    await fixture.whenStable();
    TestBed.tick();
  }

  describe('au chargement', () => {
    it('charge la session de la route', async () => {
      await rendre(session());

      expect(service.fightSession).toHaveBeenCalledWith('s1');
      expect(page.loading()).toBe(false);
      expect(page.mode()).toBe('combat');
      expect(page.cards().length).toBe(3);
    });

    it('sans identifiant, le dit au lieu de charger', async () => {
      await rendre(session(), null);

      expect(page.errorMessage()).toBe('Session introuvable.');
      expect(service.fightSession).not.toHaveBeenCalled();
    });

    it('la première carte du tour est celle de l’ordre d’initiative', async () => {
      await rendre(session());

      expect(page.activeCard()?.key).toBe('hero-1');
    });
  });

  describe('le tour', () => {
    it('« Fin du tour » enregistre le tour, et la réponse suffit : aucun rechargement', async () => {
      await rendre(session());
      service.fightSession.mockClear();
      service.updateCombatState.mockClear();

      page.onEndTurn();
      await stable();

      expect(service.updateCombatState).toHaveBeenCalledTimes(1);
      expect(service.updateCombatState.mock.calls[0][1].joues).toEqual(['hero-1']);
      expect(service.fightSession).not.toHaveBeenCalled();
      expect(page.activeCard()?.key).toBe('hero-2');
    });

    it('« Retarder » fait passer la carte après les autres, sans rien enregistrer de son tour', async () => {
      await rendre(session());

      page.onDelay();
      await stable();

      expect(page.activeCard()?.key).toBe('hero-2');
      expect(page.etat().joues).toEqual([]);
    });

    it('des dégâts s’enregistrent sur la cible, sans rechargement', async () => {
      await rendre(session());
      service.fightSession.mockClear();
      const cible = page.cards().find((card) => card.key === 'pnj-7')!;

      page.onHitApplied({target: cible, damage: 3, unarmed: false});
      await stable();

      expect(service.applyDamage).toHaveBeenCalledWith('s1', 'pnj', 7, -3);
      expect(service.fightSession).not.toHaveBeenCalled();
    });

    it('à mains nues, les dégâts ne font pas passer sous 0', async () => {
      await rendre(session({pnjs: [pnjRow(7, 2) as never]}));
      const cible = page.cards().find((card) => card.key === 'pnj-7')!;

      page.onHitApplied({target: cible, damage: 5, unarmed: true});
      await stable();

      expect(service.applyDamage).toHaveBeenCalledWith('s1', 'pnj', 7, -2);
    });

    it('quand tous les adversaires sont tombés, la fin du combat s’annonce une seule fois', async () => {
      await rendre(session({pnjs: [pnjRow(7, 0) as never]}));
      expect(dialogOpen).toHaveBeenCalledTimes(1);

      page.session.set(session({pnjs: [pnjRow(7, 0) as never], etat_combat: etat({round: 1})}));
      await stable();

      expect(dialogOpen).toHaveBeenCalledTimes(1);
    });

    it('un nouveau round fait saigner un héros mourant', async () => {
      await rendre(session({heros: [heroRow(1, -2), heroRow(2, 10)] as never}));
      service.applyDamage.mockClear();

      page.session.set(session({heros: [heroRow(1, -2), heroRow(2, 10)] as never, etat_combat: etat({round: 2})}));
      await stable();

      expect(service.applyDamage).toHaveBeenCalledWith('s1', 'hero', 1, -1);
    });
  });

  describe('les réglages de la table', () => {
    it('un réglage qui renvoie la session la remplace', async () => {
      await rendre(session({statut: 'libre'}));
      const renvoyee = session({statut: 'libre', titre: 'Après'});

      page.onTableChanged({session: renvoyee});

      expect(page.session()).toBe(renvoyee);
    });

    it('l’héroïsme d’un héros se met à jour sans requête', async () => {
      await rendre(session({statut: 'libre'}));
      service.fightSession.mockClear();

      page.onTableChanged({herosId: 'h2', heroisme: 5});

      expect(page.cards().find((card) => card.key === 'hero-2')?.heroisme).toBe(5);
      expect(service.fightSession).not.toHaveBeenCalled();
    });

    it('changer de camp reprend la session renvoyée', async () => {
      await rendre(session({statut: 'libre'}));
      const renvoyee = session({statut: 'libre', pnjs: [pnjRow(7, 10, 'heros') as never]});
      service.setCamp.mockReturnValue(of(renvoyee));
      service.fightSession.mockClear();

      page.toggleCamp(page.cards().find((card) => card.key === 'pnj-7')!);
      await stable();

      expect(service.setCamp).toHaveBeenCalledWith('s1', 'pnj', 7, 'heros');
      expect(page.session()).toBe(renvoyee);
      expect(service.fightSession).not.toHaveBeenCalled();
    });
  });
});
