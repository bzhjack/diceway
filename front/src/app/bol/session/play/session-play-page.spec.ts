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
import {SceneActionsService} from './scene-list/scene-actions.service';
import {SessionPlayPageComponent} from './session-play-page';
import {CombatTurnStore} from './table/combat-turn.store';
import {CombatWoundsService} from './table/combat-wounds.service';
import {TableCommandsService} from './table/table-commands.service';
import {TableStore} from './table/table.store';
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

function pnjRow(id: number, vitalite: number, camp = 'adversaires', rang = 'coriace', vilenie: number | null = null) {
  return {id, pnj_id: `p${id}`, camp, rang, nom: `PNJ ${id}`, surnom: null, initiative: 0, vitalite_max: 10, vitalite_courante: vitalite, vilenie_courante: vilenie, degats: 'd6', defense: 1, armes: [], pnj: null};
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


describe('SessionPlayPageComponent', () => {
  let fixture: ComponentFixture<SessionPlayPageComponent>;
  let table: TableStore;
  let combat: CombatTurnStore;
  let wounds: CombatWoundsService;
  let commands: TableCommandsService;
  const service = {
    fightSession: vi.fn(),
    jouer: vi.fn(() => EMPTY),
    updateCombatState: vi.fn(),
    applyDamage: vi.fn(),
    setCamp: vi.fn(),
    removeCombatant: vi.fn(),
    adjustVilenie: vi.fn(),
    fuiteOpportune: vi.fn(),
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
    TestBed.overrideComponent(SessionPlayPageComponent, {set: {imports: [], template: ''}});
    TestBed.overrideProvider(SceneStageStore, {useValue: {sync: vi.fn(), reload: vi.fn(), rideau: signal(null), carton: signal(null)}});
    // Le gabarit d'origine a des blocs `@defer` : ses dépendances se résolvent de façon asynchrone.
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(SessionPlayPageComponent);
    const injector = fixture.debugElement.injector;
    table = injector.get(TableStore);
    combat = injector.get(CombatTurnStore);
    wounds = injector.get(CombatWoundsService);
    commands = injector.get(TableCommandsService);
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
      expect(table.loading()).toBe(false);
      expect(table.mode()).toBe('combat');
      expect(table.cards().length).toBe(3);
    });

    it('sans identifiant, le dit au lieu de charger', async () => {
      await rendre(session(), null);

      expect(table.errorMessage()).toBe('Session introuvable.');
      expect(service.fightSession).not.toHaveBeenCalled();
    });

    it('la première carte du tour est celle de l’ordre d’initiative', async () => {
      await rendre(session());

      expect(combat.activeCard()?.key).toBe('hero-1');
    });
  });

  describe('le tour', () => {
    it('« Fin du tour » enregistre le tour, et la réponse suffit : aucun rechargement', async () => {
      await rendre(session());
      service.fightSession.mockClear();
      service.updateCombatState.mockClear();

      combat.onEndTurn();
      await stable();

      expect(service.updateCombatState).toHaveBeenCalledTimes(1);
      expect(service.updateCombatState.mock.calls[0][1].joues).toEqual(['hero-1']);
      expect(service.fightSession).not.toHaveBeenCalled();
      expect(combat.activeCard()?.key).toBe('hero-2');
    });

    it('« Retarder » fait passer la carte après les autres, sans rien enregistrer de son tour', async () => {
      await rendre(session());

      combat.onDelay();
      await stable();

      expect(combat.activeCard()?.key).toBe('hero-2');
      expect(combat.etat().joues).toEqual([]);
    });

    it('des dégâts s’enregistrent sur la cible, sans rechargement', async () => {
      await rendre(session());
      service.fightSession.mockClear();
      const cible = table.cards().find((card) => card.key === 'pnj-7')!;

      wounds.onHitApplied({target: cible, damage: 3, unarmed: false});
      await stable();

      expect(service.applyDamage).toHaveBeenCalledWith('s1', 'pnj', 7, -3);
      expect(service.fightSession).not.toHaveBeenCalled();
    });

    it('à mains nues, les dégâts ne font pas passer sous 0', async () => {
      await rendre(session({pnjs: [pnjRow(7, 2) as never]}));
      const cible = table.cards().find((card) => card.key === 'pnj-7')!;

      wounds.onHitApplied({target: cible, damage: 5, unarmed: true});
      await stable();

      expect(service.applyDamage).toHaveBeenCalledWith('s1', 'pnj', 7, -2);
    });

    it('quand tous les adversaires sont tombés, la fin du combat s’annonce une seule fois', async () => {
      await rendre(session({pnjs: [pnjRow(7, 0) as never]}));
      expect(dialogOpen).toHaveBeenCalledTimes(1);

      table.session.set(session({pnjs: [pnjRow(7, 0) as never], etat_combat: etat({round: 1})}));
      await stable();

      expect(dialogOpen).toHaveBeenCalledTimes(1);
    });

    it('un nouveau round commencé sur cet écran fait saigner un héros mourant', async () => {
      await rendre(session({heros: [heroRow(1, -2), heroRow(2, 10)] as never}));
      service.applyDamage.mockClear();

      // Le serveur rend la table telle qu'elle est (le round en cours compris).
      service.applyDamage.mockImplementation(() => of(table.session()));
      service.fightSession.mockImplementation(() => of(table.session()));

      // Le héros 2 puis le PNJ jouent : le round 2 commence.
      combat.onEndTurn();
      await stable();
      combat.onEndTurn();
      await stable();

      expect(combat.etat().round).toBe(2);
      expect(service.applyDamage).toHaveBeenCalledExactlyOnceWith('s1', 'hero', 1, -1);
    });

    it('un nouveau round reçu dans la session (un second écran sur la même table) ne refait pas saigner le mourant', async () => {
      await rendre(session({heros: [heroRow(1, -2), heroRow(2, 10)] as never}));
      service.applyDamage.mockClear();

      table.session.set(session({heros: [heroRow(1, -2), heroRow(2, 10)] as never, etat_combat: etat({round: 2})}));
      await stable();

      expect(service.applyDamage).not.toHaveBeenCalled();
    });
  });

  describe('la fuite opportune', () => {
    const avecRival = (vilenie: number, over: Partial<BolFightSessionModel> = {}): BolFightSessionModel =>
      session({pnjs: [pnjRow(7, 10) as never, pnjRow(9, 0, 'adversaires', 'rival', vilenie) as never], ...over});

    it('un rival à terre peut encore fuir s’il a de la vilénie', async () => {
      await rendre(avecRival(2));
      const rival = table.cards().find((card) => card.key === 'pnj-9')!;

      expect(combat.canFlee(rival)).toBe(true);
    });

    it('fuir dépense 1 point de vilénie et retire le rival du combat en un seul appel, et la frise le dit enfui', async () => {
      await rendre(avecRival(2));
      service.updateCombatState.mockClear();
      service.fuiteOpportune.mockReturnValue(of(avecRival(1, {etat_combat: etat({exclus: ['pnj-9'], fuis: ['pnj-9']})})));
      const rival = table.cards().find((card) => card.key === 'pnj-9')!;

      combat.flee(rival);
      await stable();

      // Le serveur dépense la vilénie et enregistre la fuite ensemble : ni dépense ni état du combat envoyés à part.
      expect(service.fuiteOpportune).toHaveBeenCalledExactlyOnceWith('s1', 9);
      expect(service.adjustVilenie).not.toHaveBeenCalled();
      expect(service.updateCombatState.mock.calls.some(([, envoye]) => (envoye as EtatCombatDto).fuis?.includes('pnj-9'))).toBe(false);
      expect(combat.turnEntries().find((entry) => entry.key === 'pnj-9')?.horsCombat).toBe('enfui');
      expect(combat.canFlee(table.cards().find((card) => card.key === 'pnj-9')!)).toBe(false);
    });

    it('sans vilénie, pas de fuite', async () => {
      await rendre(avecRival(0));
      const rival = table.cards().find((card) => card.key === 'pnj-9')!;

      combat.flee(rival);
      await stable();

      expect(combat.canFlee(rival)).toBe(false);
      expect(service.fuiteOpportune).not.toHaveBeenCalled();
    });

    it('un rival allié des héros ne fuit pas ainsi', async () => {
      await rendre(session({pnjs: [pnjRow(7, 10) as never, pnjRow(9, 0, 'heros', 'rival', 2) as never]}));
      const allie = table.cards().find((card) => card.key === 'pnj-9')!;

      combat.flee(allie);
      await stable();

      expect(combat.canFlee(allie)).toBe(false);
      expect(service.fuiteOpportune).not.toHaveBeenCalled();
    });
  });

  describe('retirer du combat', () => {
    it('le MJ retire une carte : elle ne joue plus, ne se vise plus, et la frise la dit retirée', async () => {
      await rendre(session());
      const pnj = table.cards().find((card) => card.key === 'pnj-7')!;
      expect(combat.canWithdraw(pnj)).toBe(true);

      combat.withdraw(pnj);
      await stable();

      const envoye = service.updateCombatState.mock.calls.at(-1)![1] as EtatCombatDto;
      expect(envoye.exclus).toEqual(['pnj-7']);
      expect(combat.turnEntries().find((entry) => entry.key === 'pnj-7')?.horsCombat).toBe('retiré');
      expect(combat.canWithdraw(table.cards().find((card) => card.key === 'pnj-7')!)).toBe(false);
    });
  });

  describe('les chutes oubliées', () => {
    it('un héros relevé au-dessus de 0 oublie qu’il avait sombré', async () => {
      const sombre = {id: 'e-1', origine: 'inconscient', libelle: 'inconscient', porteur: 'hero-1', stat: 'action', valeur: 0, quand: 'attaque', duree: {type: 'combat'}, manuel: false};
      await rendre(session({heros: [heroRow(1, 0), heroRow(2, 10)] as never, etat_combat: etat({effets: [sombre] as never})}));
      service.updateCombatState.mockClear();

      table.session.set(session({heros: [heroRow(1, 4), heroRow(2, 10)] as never, etat_combat: etat({effets: [sombre] as never})}));
      await stable();

      const envoye = service.updateCombatState.mock.calls.at(-1)![1] as EtatCombatDto;
      expect(envoye.effets).toEqual([]);
    });
  });

  describe('le secours', () => {
    it('un PNJ allié peut secourir un héros mourant à son tour', async () => {
      await rendre(session({heros: [heroRow(1, -2)] as never, pnjs: [pnjRow(8, 10, 'heros') as never, pnjRow(7, 10) as never]}));

      expect(combat.activeCard()?.key).toBe('pnj-8');
      expect(combat.rescuePatients().map((card) => card.key)).toEqual(['hero-1']);
    });
  });

  describe('la mêlée de piétaille', () => {
    const melee = (over: Partial<EtatCombatDto> = {}): BolFightSessionModel =>
      session({
        pnjs: [pnjRow(20, 2, 'heros', 'pietaille') as never, pnjRow(21, 2, 'adversaires', 'pietaille') as never, pnjRow(22, 2, 'adversaires', 'pietaille') as never],
        etat_combat: etat(over),
      });

    it('n’est proposée que si les deux camps ont de la piétaille debout', async () => {
      await rendre(session());
      expect(combat.meleeDisponibilite()).toBe('absente');

      table.session.set(melee());
      await stable();
      expect(combat.meleeDisponibilite()).toBe('disponible');
    });

    it('« Appliquer » met hors de combat les piétailles cochées et retient la mêlée du round', async () => {
      await rendre(melee({round: 2}));
      dialogOpen.mockReturnValue({afterClosed: () => of({tombes: ['pnj-22']})});
      service.updateCombatState.mockClear();

      wounds.onPietailleMelee();
      await stable();

      expect(service.applyDamage).toHaveBeenCalledTimes(1);
      expect(service.applyDamage).toHaveBeenCalledWith('s1', 'pnj', 22, -2);
      expect(service.updateCombatState.mock.calls.at(-1)![1].melee).toBe(2);
    });

    it('une fois faite, elle attend le round suivant', async () => {
      await rendre(melee({round: 2, melee: 2}));
      dialogOpen.mockClear();

      expect(combat.meleeDisponibilite()).toBe('faite');
      wounds.onPietailleMelee();
      expect(dialogOpen).not.toHaveBeenCalled();
    });
  });

  describe('les réglages de la table', () => {
    it('un réglage qui renvoie la session la remplace', async () => {
      await rendre(session({statut: 'libre'}));
      const renvoyee = session({statut: 'libre', titre: 'Après'});

      table.onTableChanged({session: renvoyee});

      expect(table.session()).toBe(renvoyee);
    });

    it('l’héroïsme d’un héros se met à jour sans requête', async () => {
      await rendre(session({statut: 'libre'}));
      service.fightSession.mockClear();

      table.onTableChanged({herosId: 'h2', heroisme: 5});

      expect(table.cards().find((card) => card.key === 'hero-2')?.heroisme).toBe(5);
      expect(service.fightSession).not.toHaveBeenCalled();
    });

    it('changer de camp reprend la session renvoyée', async () => {
      await rendre(session({statut: 'libre'}));
      const renvoyee = session({statut: 'libre', pnjs: [pnjRow(7, 10, 'heros') as never]});
      service.setCamp.mockReturnValue(of(renvoyee));
      service.fightSession.mockClear();

      commands.toggleCamp(table.cards().find((card) => card.key === 'pnj-7')!);
      await stable();

      expect(service.setCamp).toHaveBeenCalledWith('s1', 'pnj', 7, 'heros');
      expect(table.session()).toBe(renvoyee);
      expect(service.fightSession).not.toHaveBeenCalled();
    });
  });
});
