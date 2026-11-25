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

const AXEL = fiche('h2', 'Axel', 3);
(AXEL as {carrieres: unknown}).carrieres = [
  {carriere_id: 1, carriere: {carriere: 'Chasseur'}, value: 1},
  {carriere_id: 2, carriere: {carriere: 'Barbare'}, value: 2},
];
const FICHES: Record<string, BolHerosModel> = {h1: fiche('h1', 'Grimar', 1), h2: AXEL};

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

  it('le fond de la page est l’illustration de la scène en cours, comme à la table ; sans image, le décor par défaut', async () => {
    await rendre(session({scene: {id: 'sc1', titre: 'Les gardiens s’éveillent', image: '/assets/bol/scenes/gardiens.webp'}}));
    expect((element.querySelector('.scd-shell') as HTMLElement).style.getPropertyValue('--scd-decor')).toBe('url("/assets/bol/scenes/gardiens.webp")');

    TestBed.resetTestingModule();
    await rendre(session({scene: {id: 'sc2', titre: 'Trajet jusqu’au temple', image: null}}));
    expect((element.querySelector('.scd-shell') as HTMLElement).style.getPropertyValue('--scd-decor')).toBe('url("/assets/bol/fond-heros.webp")');
  });

  it('les options de la rencontre sont toujours en vue : l’embuscade, le dé du MJ pour tous (un second clic le retire), le malus adverse', async () => {
    await rendre(session());
    const bandeau = element.querySelector('.scd-rencontre')!;
    const bouton = (texteOuLabel: string) =>
      [...bandeau.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.getAttribute('aria-label') === texteOuLabel || (b.textContent ?? '').replace(/\s+/g, ' ').trim().startsWith(texteOuLabel))!;
    const cliquer = async (b: HTMLButtonElement) => {
      b.click();
      await stable();
    };

    expect(bandeau).not.toBeNull();
    expect(element.querySelector('#scd-options-btn')).toBeNull();
    expect([...bandeau.querySelectorAll('.scd-label')].map((l) => l.textContent?.trim())).toEqual(['Embuscade', 'Dé du MJ pour tous', 'Malus adverse']);

    await cliquer(bouton('Tendue par les héros'));
    expect(bouton('Tendue par les héros').getAttribute('aria-pressed')).toBe('true');

    const bonus = bouton('Dé de bonus du MJ pour tous les héros');
    await cliquer(bonus);
    expect(bonus.getAttribute('aria-pressed')).toBe('true');
    expect(bandeau.querySelector('.scd-rencontre-groupe:nth-child(2) .scd-hint')?.textContent?.trim()).toBe('bonus pour tous');
    await cliquer(bouton('Dé de malus du MJ pour tous les héros'));
    expect(bonus.getAttribute('aria-pressed')).toBe('false');
    await cliquer(bouton('Dé de malus du MJ pour tous les héros'));
    expect(bandeau.querySelector('.scd-rencontre-groupe:nth-child(2) .scd-hint')?.textContent?.trim()).toBe('aucun');
    expect(bandeau.querySelector('dw-value-stepper')).not.toBeNull();
    // D'où vient le malus : dans l'infobulle du « i », à côté du compteur.
    expect(bandeau.querySelector('.scd-info')?.getAttribute('aria-label')).toMatch(/^Malus adverse : /);
  });

  it('ce que le MJ accorde est dans la ligne de chaque héros : ses dés, et sa carrière dans un menu', async () => {
    await rendre(session());
    const cliquer = async (b: HTMLButtonElement) => {
      b.click();
      await stable();
    };
    const axel = element.querySelector('[aria-label="Ce que le MJ accorde à Axel"]')!;
    const grimar = element.querySelector('[aria-label="Ce que le MJ accorde à Grimar"]')!;
    const bonus = axel.querySelector<HTMLButtonElement>('.scd-de--bonus')!;

    // Plus de panneau : tout est en vue.
    expect(element.querySelector('.scd-mods-btn')).toBeNull();
    await cliquer(bonus);
    expect(bonus.getAttribute('aria-pressed')).toBe('true');
    await cliquer(bonus);
    expect(bonus.getAttribute('aria-pressed')).toBe('false');

    expect(grimar.querySelector('.scd-carriere--aucune')?.textContent?.trim()).toBe('Sans carrière');
    const carriere = axel.querySelector<HTMLButtonElement>('button.scd-carriere')!;
    expect(carriere.getAttribute('aria-label')).toBe('Carrière utile pour Axel : aucune');
    await cliquer(carriere);
    const choix = [...document.querySelectorAll<HTMLButtonElement>('.scd-carrieres-menu [role="menuitemradio"]')];
    expect(choix.map((b) => b.textContent?.replace('check', '').trim())).toEqual(['Aucune', 'Chasseur +1', 'Barbare +2']);
    expect(choix[0].getAttribute('aria-checked')).toBe('true');
    await cliquer(choix[2]);
    expect(carriere.getAttribute('aria-label')).toBe('Carrière utile pour Axel : Barbare +2');
    expect(carriere.classList).toContain('scd-carriere--choisie');
  });

  it('une carte par héros ; le jet fait, le cartouche du seuil dit le verdict et ce qu’il fallait', async () => {
    await rendre(session());
    const cartouche = () => element.querySelector('.scd-carte:not(.scd-carte--attente) .scd-need');

    expect(element.querySelectorAll('.scd-carte').length).toBe(2);
    expect(element.querySelector('.scd-need-verdict')).toBeNull();
    expect(element.querySelector('.scd-need .sr-only')?.textContent).toMatch(/^Il te faut /);

    await saisir(0, '12');

    expect(cartouche()?.classList).toContain('scd-need--verdict');
    expect(cartouche()?.querySelector('.scd-need-verdict')?.textContent?.trim()).not.toBe('');
    expect(cartouche()?.querySelector('.scd-need-rappel')?.textContent).toMatch(/^il fallait \d+\+$/);
    expect(element.querySelector('.scd-sceau')).toBeNull();
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
