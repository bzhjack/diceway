import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {NEVER} from 'rxjs';
import {BolSceneJet} from '../../../models/bol-scene.model';
import {BolCreaturesService} from '../../../services/bol-creatures.service';
import {BolDemonsService} from '../../../services/bol-demons.service';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {BolPnjService} from '../../../services/bol-pnj.service';
import {ExpandedCardDialogData} from '../../models/expanded-card-dialog.model';
import {TapisCard} from '../../models/tapis.model';
import {CombatStatsStore} from './combat-stats.store';
import {CombatTurnStore} from './combat-turn.store';
import {ExpandedCardStore} from './expanded-card.store';
import {TableStore} from './table.store';

function heros(nom: string, pivotId: number): TapisCard {
  return {
    key: `hero-${pivotId}`,
    kind: 'hero',
    camp: 'heros',
    pivotId,
    sourceId: `h${pivotId}`,
    nom,
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '1',
    vitaliteCourante: 10,
    vitaliteMax: 10,
    joueur: null,
    heroisme: 3,
    attitude: null,
    vilenie: null,
  };
}

const GRIMAR = heros('Grimar', 1);
const COQUILLAGE: BolSceneJet = {
  titre: 'Coquillage',
  attributs: ['vigueur'],
  difficulte: 'ardue',
  enjeu: null,
  echec: null,
  reussite: null,
  carriere: null,
  quand: null,
};
const ALGUES: BolSceneJet = {...COQUILLAGE, titre: 'Algues', attributs: ['esprit'], difficulte: 'difficile'};

describe('ExpandedCardStore : lancer un jet de la scène', () => {
  let store: ExpandedCardStore;
  const open = vi.fn();

  beforeEach(() => {
    open.mockReset();
    open.mockReturnValue({afterClosed: () => NEVER, close: vi.fn()});
    TestBed.configureTestingModule({
      providers: [
        ExpandedCardStore,
        {provide: MatDialog, useValue: {open}},
        {
          provide: TableStore,
          useValue: {
            cards: signal([GRIMAR]),
            sessionId: signal('s1'),
            selectedKeys: signal(new Set<string>()),
            returnUrl: signal(null),
          },
        },
        {provide: CombatStatsStore, useValue: {}},
        {provide: CombatTurnStore, useValue: {canFlee: () => false, canWithdraw: () => false}},
        {provide: BolHerosService, useValue: {heros: () => NEVER}},
        {provide: BolPnjService, useValue: {}},
        {provide: BolCreaturesService, useValue: {}},
        {provide: BolDemonsService, useValue: {}},
        {provide: BolFightSessionService, useValue: {}},
      ],
    });
    store = TestBed.inject(ExpandedCardStore);
  });

  const donnees = (): ExpandedCardDialogData => open.mock.calls[0][1].data as ExpandedCardDialogData;

  it('ouvre la carte du héros, le panneau de jet réglé sur l’attribut et la difficulté du jet', () => {
    store.lancerJet(GRIMAR, COQUILLAGE);

    expect(open).toHaveBeenCalledTimes(1);
    expect(donnees().card()).toEqual(GRIMAR);
    expect(donnees().jetPreset()).toEqual({attributs: ['vigueur'], difficulty: {label: 'Ardue', modifier: -1}});
  });

  it('sur la carte déjà ouverte, change le préréglage sans rouvrir de dialogue', () => {
    store.lancerJet(GRIMAR, COQUILLAGE);
    store.lancerJet(GRIMAR, ALGUES);

    expect(open).toHaveBeenCalledTimes(1);
    expect(donnees().jetPreset()).toEqual({attributs: ['esprit'], difficulty: {label: 'Difficile', modifier: -2}});
  });

  it('un clic ordinaire sur une carte efface le préréglage', () => {
    store.lancerJet(GRIMAR, COQUILLAGE);
    store.foldCard();
    store.onCardToggled(GRIMAR);

    expect(donnees().jetPreset()).toBeNull();
  });
});
