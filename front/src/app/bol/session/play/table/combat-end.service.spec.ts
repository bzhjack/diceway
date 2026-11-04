import {signal, WritableSignal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {EMPTY, of, Subject} from 'rxjs';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {CARRIERE_MEDECIN_ID} from '../../../bol-rules.constants';
import {EtatCombat} from '../../models/combat-turn.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {AfterCombatDialogData} from '../../models/after-combat-dialog.model';
import {effetParalyse} from '../tapis/combat-effects.util';
import {AfterCombatDialogComponent} from '../after-combat-dialog/after-combat-dialog';
import {CombatEndService} from './combat-end.service';
import {CombatTurnStore} from './combat-turn.store';
import {TableStore} from './table.store';

function card(kind: TapisKind, pivotId: number, extra: Partial<TapisCard> = {}): TapisCard {
  return {
    key: `${kind}-${pivotId}`,
    kind,
    camp: kind === 'hero' ? 'heros' : 'adversaires',
    pivotId,
    sourceId: `src-${kind}-${pivotId}`,
    nom: `${kind} ${pivotId}`,
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '0',
    vitaliteCourante: 10,
    vitaliteMax: 10,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
    ...extra,
  };
}

/** Une fiche de médecin : chaque héros et PNJ allié de la table en a la carrière. */
const MEDECIN = {
  id: 'h',
  active: true,
  origines: {nom: 'Médecin', joueur: null},
  carrieres: [{carriere_id: CARRIERE_MEDECIN_ID, carriere: {carriere: 'Médecin'}, value: 2}],
  armes: [],
  armures: [],
  traits: [],
} as unknown as BolHerosModel;

function etat(over: Partial<EtatCombat> = {}): EtatCombat {
  return {round: 2, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null, ...over};
}

function memoire(): Storage {
  const valeurs = new Map<string, string>();
  return {
    getItem: (cle: string) => valeurs.get(cle) ?? null,
    setItem: (cle: string, valeur: string) => void valeurs.set(cle, valeur),
    removeItem: (cle: string) => void valeurs.delete(cle),
  } as Storage;
}

describe('CombatEndService', () => {
  const open = vi.fn();
  let cartes: WritableSignal<readonly TapisCard[]>;
  let ouverts: unknown[];
  let tousFermes: Subject<void>;

  beforeEach(() => vi.stubGlobal('localStorage', memoire()));
  afterEach(() => vi.unstubAllGlobals());

  function setup(cards: readonly TapisCard[], etatCombat: EtatCombat): CombatEndService {
    open.mockReset();
    open.mockReturnValue({afterClosed: () => EMPTY});
    cartes = signal(cards);
    ouverts = [];
    tousFermes = new Subject<void>();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CombatEndService,
        {provide: TableStore, useValue: {mode: signal('combat'), cards: cartes, session: signal({id: 's1'}), loadSession: vi.fn()}},
        {provide: CombatTurnStore, useValue: {etat: signal(etatCombat)}},
        {provide: BolHerosService, useValue: {heros: () => of(MEDECIN)}},
        {provide: BolFightSessionService, useValue: {}},
        {
          provide: MatDialog,
          useValue: {
            open,
            get openDialogs() {
              return ouverts;
            },
            afterAllClosed: tousFermes,
          },
        },
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    const service = TestBed.inject(CombatEndService);
    TestBed.tick();
    return service;
  }

  const debout = () => [card('hero', 1), card('pnj', 7)];
  const vaincu = () => [card('hero', 1), card('pnj', 7, {vitaliteCourante: 0})];

  /** L'issue tombe, se dément, puis retombe : une réponse du serveur, un héros relevé qui retombe… */
  function issueQuiVacille(): void {
    cartes.set(debout());
    TestBed.tick();
    cartes.set(vaincu());
    TestBed.tick();
  }

  it('quand un camp tombe, ouvre directement « Après combat », qui dit l’issue et les mourants à secourir', () => {
    setup([card('hero', 1, {nom: 'Axel', vitaliteCourante: -2}), card('hero', 2), card('pnj', 7, {vitaliteCourante: 0})], etat());

    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toBe(AfterCombatDialogComponent);
    const data = (open.mock.calls[0][1] as {data: AfterCombatDialogData}).data;
    expect(data.outcome).toBe('victoire');
    expect(data.mourants).toEqual(['Axel']);
  });

  it('annonce une victoire quand le dernier adversaire debout est paralysé', () => {
    setup([card('hero', 1), card('pnj', 7)], etat({effets: [{...effetParalyse('pnj-7'), id: 'e-1'}]}));

    expect((open.mock.calls[0][1] as {data: AfterCombatDialogData}).data.outcome).toBe('victoire');
  });

  it('« Terminer » du bandeau ne dit pas d’issue', () => {
    const service = setup(debout(), etat());

    service.askEndCombat();

    expect((open.mock.calls[0][1] as {data: AfterCombatDialogData}).data.outcome ?? null).toBeNull();
  });

  it('revenir sur la table n’annonce pas de nouveau l’issue déjà annoncée', () => {
    setup(vaincu(), etat());
    expect(open).toHaveBeenCalledTimes(1);

    setup(vaincu(), etat());

    expect(open).not.toHaveBeenCalled();
  });

  it('sans stockage disponible, l’issue ne s’annonce quand même qu’une fois', () => {
    vi.stubGlobal('localStorage', undefined);
    setup(vaincu(), etat());
    expect(open).toHaveBeenCalledTimes(1);

    cartes.set([...vaincu(), card('pnj', 8, {vitaliteCourante: 0})]);
    TestBed.tick();

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('une issue démentie entre-temps s’annonce de nouveau en revenant sur la table', () => {
    setup(vaincu(), etat());
    cartes.set(debout());
    TestBed.tick();

    setup(vaincu(), etat());

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('une issue qui vacille sous une autre boîte ne s’annonce qu’une fois quand elle se ferme', () => {
    setup(debout(), etat());
    ouverts = [{}];
    cartes.set(vaincu());
    TestBed.tick();
    issueQuiVacille();
    expect(open).not.toHaveBeenCalled();

    ouverts = [];
    tousFermes.next();

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('quitter la table pendant une attente n’ouvre rien, et l’issue s’annonce au retour', () => {
    setup(debout(), etat());
    ouverts = [{}];
    cartes.set(vaincu());
    TestBed.tick();
    const fermes = tousFermes;

    TestBed.resetTestingModule();
    ouverts = [];
    fermes.next();
    expect(open).not.toHaveBeenCalled();

    setup(vaincu(), etat());
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('une issue démentie pendant l’attente ne s’ouvre pas', () => {
    setup(debout(), etat());
    ouverts = [{}];
    cartes.set(vaincu());
    TestBed.tick();
    cartes.set(debout());
    TestBed.tick();

    ouverts = [];
    tousFermes.next();

    expect(open).not.toHaveBeenCalled();
  });

  it('une issue qui vacille pendant « Après combat » n’en ouvre pas un second', () => {
    const ferme = new Subject<undefined>();
    setup(debout(), etat());
    open.mockReturnValue({afterClosed: () => ferme});
    cartes.set(vaincu());
    TestBed.tick();
    expect(open).toHaveBeenCalledTimes(1);

    ouverts = [{}];
    issueQuiVacille();
    ouverts = [];
    tousFermes.next();

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('un second « Terminer » pendant qu’« Après combat » est ouvert est ignoré', () => {
    const ferme = new Subject<undefined>();
    const service = setup(debout(), etat());
    open.mockReturnValue({afterClosed: () => ferme});

    service.askEndCombat();
    service.askEndCombat();

    expect(open).toHaveBeenCalledTimes(1);

    ferme.next(undefined);
    ferme.complete();
    open.mockReturnValue({afterClosed: () => EMPTY});
    service.askEndCombat();
    expect(open).toHaveBeenCalledTimes(2);
  });

  it('un héros relevé puis retombé fait de nouveau annoncer l’issue', () => {
    setup(vaincu(), etat());
    open.mockClear();

    issueQuiVacille();

    expect(open).toHaveBeenCalledTimes(1);
  });

  it('« Après combat » only offers healers who are still standing', () => {
    const valide = card('hero', 1, {nom: 'Debout'});
    const inconscient = card('hero', 2, {nom: 'Inconscient', vitaliteCourante: 0});
    const mort = card('hero', 3, {nom: 'Mort', vitaliteCourante: -7});
    const allieATerre = card('pnj', 4, {nom: 'Allié à terre', camp: 'heros', vitaliteCourante: 0});
    const paralyse = card('hero', 5, {nom: 'Paralysé'});
    const allie = card('pnj', 6, {nom: 'Allié', camp: 'heros'});
    const service = setup([valide, inconscient, mort, allieATerre, paralyse, allie, card('pnj', 7, {vitaliteCourante: 0})], etat({effets: [{...effetParalyse('hero-5'), id: 'e-1'}]}));
    open.mockClear();

    service.askEndCombat();

    const data = (open.mock.calls[0][1] as {data: AfterCombatDialogData}).data;
    expect(data.healers.map((healer) => healer.nom)).toEqual(['Debout', 'Allié']);
  });
});
