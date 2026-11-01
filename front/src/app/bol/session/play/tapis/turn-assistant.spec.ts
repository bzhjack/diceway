import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {BolArmeModel, BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {AppliedHit, HeroismeChange, ResolvedCombatStats, VitaliteChange} from '../../models/combat-attack.model';
import {TapisCard} from '../../models/tapis.model';
import {TurnAssistantComponent} from './turn-assistant';

function carte(over: Partial<TapisCard> = {}): TapisCard {
  return {
    key: 'hero-1',
    kind: 'hero',
    camp: 'heros',
    pivotId: 1,
    sourceId: 'h1',
    nom: 'Grimar',
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '1',
    vitaliteCourante: 11,
    vitaliteMax: 11,
    joueur: 'Clara',
    heroisme: 2,
    attitude: null,
    vilenie: null,
    ...over,
  };
}

const cible = carte({key: 'pnj-7', kind: 'pnj', camp: 'adversaires', pivotId: 7, sourceId: '15', nom: 'Kalzatan', rang: 'Coriace', joueur: null, heroisme: null, vitaliteCourante: 10, vitaliteMax: 10});

function stats(over: Partial<ResolvedCombatStats> = {}): ResolvedCombatStats {
  return {
    agilite: 1,
    vigueur: 2,
    melee: 2,
    tir: 0,
    attaque: null,
    defense: 1,
    degats: 'd6',
    protection: 1,
    protectionText: null,
    bouclierMalusUneAttaque: 0,
    bouclierDefenseToutes: 0,
    herosId: 'h1',
    heroisme: 2,
    ...over,
  };
}

function arme(id: number, over: Partial<BolArmeModel> = {}): BolHerosArmeModel {
  return {id, arme_id: id, equipee: true, arme: {id, arme: 'Épée', type: 'M', degats: 'd6', portee: null, notes: null, ...over}};
}

function option(slug: string, label: string, modificateur = 0): BolCombatOptionModel {
  return {id: slug.length, slug, label, modificateur, modificateur_armor: false, note: '', ordre: 0};
}

const OPTIONS: readonly BolCombatOptionModel[] = [
  option('none', 'Aucune'),
  option('defensive', 'Posture défensive', -1),
  option('offensive', 'Posture offensive', 1),
];

describe('TurnAssistantComponent', () => {
  let fixture: ComponentFixture<TurnAssistantComponent>;
  let element: HTMLElement;
  const events = {
    target: [] as (TapisCard | null)[],
    rolled: [] as TapisCard[],
    applied: [] as AppliedHit[],
    endTurn: [] as boolean[],
    totalDefense: [] as boolean[],
    heroisme: [] as number[],
    targetHeroisme: [] as HeroismeChange[],
    vitalite: [] as VitaliteChange[],
    horde: [] as (readonly string[])[],
    effects: [] as string[],
    removed: [] as string[],
  };

  async function rendre(inputs: Record<string, unknown> = {}): Promise<void> {
    TestBed.configureTestingModule({imports: [MatIconTestingModule]});
    fixture = TestBed.createComponent(TurnAssistantComponent);
    element = fixture.nativeElement as HTMLElement;
    const c = fixture.componentInstance;
    c.targetSelected.subscribe((v) => events.target.push(v));
    c.attackRolled.subscribe((v) => events.rolled.push(v));
    c.damageApplied.subscribe((v) => events.applied.push(v));
    c.endTurnRequested.subscribe((v) => events.endTurn.push(v));
    c.totalDefenseRequested.subscribe((v) => events.totalDefense.push(v));
    c.heroismeAdjusted.subscribe((v) => events.heroisme.push(v));
    c.targetHeroismeAdjusted.subscribe((v) => events.targetHeroisme.push(v));
    c.vitaliteAdjusted.subscribe((v) => events.vitalite.push(v));
    c.hordeChanged.subscribe((v) => events.horde.push(v));
    c.effectAdded.subscribe((v) => events.effects.push(v.origine));
    c.effectRemoved.subscribe((v) => events.removed.push(v));
    const all: Record<string, unknown> = {card: carte(), attacker: stats(), combatOptions: OPTIONS, armes: [arme(1)], ownedArmes: [arme(1)], ...inputs};
    for (const [name, value] of Object.entries(all)) {
      fixture.componentRef.setInput(name, value);
    }
    await stable();
  }

  async function stable(): Promise<void> {
    await fixture.whenStable();
    TestBed.tick();
  }

  /** Une cible visée, avec ses chiffres : le cas courant. */
  async function viser(inputs: Record<string, unknown> = {}): Promise<void> {
    await rendre({targets: [cible], target: cible, targetStats: stats({herosId: null, heroisme: null}), ...inputs});
  }

  function texte(): string {
    return (element.textContent ?? '').replace(/\s+/g, ' ');
  }

  async function saisir(selecteur: string, valeur: string): Promise<void> {
    const input = element.querySelector<HTMLInputElement>(selecteur)!;
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
    await stable();
  }

  const saisirAttaque = (valeur: string) => saisir('input[aria-label^="Total des deux dés"]', valeur);
  const saisirDegats = (valeur: string) => saisir('input[aria-label^="Dé de dégâts"]', valeur);

  function bouton(libelle: string | RegExp): HTMLButtonElement {
    const trouve = [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) =>
      typeof libelle === 'string' ? `${b.textContent} ${b.getAttribute('aria-label')}`.includes(libelle) : libelle.test(`${b.textContent} ${b.getAttribute('aria-label')}`),
    );
    if (!trouve) {
      throw new Error(`Pas de bouton « ${libelle} » : ${[...element.querySelectorAll('button')].map((b) => (b.textContent ?? '').trim()).join(' | ')}`);
    }
    return trouve;
  }

  async function cliquer(libelle: string | RegExp): Promise<void> {
    bouton(libelle).click();
    await stable();
  }

  beforeEach(() => {
    Object.values(events).forEach((liste) => (liste.length = 0));
  });

  describe('la cible', () => {
    it('propose les cibles, et un clic en choisit une', async () => {
      await rendre({targets: [cible]});

      expect(texte()).toContain('Kalzatan');
      element.querySelector<HTMLButtonElement>('.tas-cible button')!.click();

      expect(events.target).toEqual([cible]);
    });

    it('« Changer d’adversaire » renonce à la cible', async () => {
      await viser();

      await cliquer('Changer d’adversaire');

      expect(events.target).toEqual([null]);
    });
  });

  describe('le jet d’attaque', () => {
    it('annonce ce qu’il faut aux dés : 2d6 + agilité + mêlée − défense, pour 9', async () => {
      // +1 agilité, +2 mêlée, −1 défense : il faut 7 aux dés, soit 58 %.
      await viser();

      expect(texte()).toContain('7+');
      expect(texte()).toContain('58 %');
    });

    it('un total insuffisant rate, et il ne reste qu’à finir le tour', async () => {
      await viser();

      await saisirAttaque('5');

      expect(texte()).toContain('Raté');
      expect(texte()).toContain('il manquait 2');
      expect(events.rolled).toEqual([cible]);
      await cliquer('Fin du tour');
      expect(events.endTurn).toEqual([false]);
    });

    it('un total suffisant touche : le dé de dégâts ajoute la vigueur et retire la protection', async () => {
      await viser();

      await saisirAttaque('8');
      expect(texte()).toContain('Touché');
      expect(texte()).toContain('réussi de 1');

      // 4 au dé, +2 vigueur, −1 protection.
      await saisirDegats('4');
      expect(texte()).toContain('= 5');

      await cliquer('Appliquer');
      expect(events.applied).toEqual([{target: cible, damage: 5, unarmed: false}]);
    });

    it('un double 1 rate toujours, un double 6 touche toujours', async () => {
      await viser({targetStats: stats({defense: -20, herosId: null, heroisme: null})});
      await saisirAttaque('2');
      expect(texte()).toContain('Double 1 : échec automatique.');

      await saisirAttaque('12');
      expect(texte()).toContain('Succès héroïque');
    });

    it('une case vidée efface le jet', async () => {
      await viser();
      await saisirAttaque('5');

      await saisirAttaque('');

      expect(texte()).not.toContain('Raté');
    });

    it('un autre attaquant repart de zéro', async () => {
      await viser();
      await saisirAttaque('5');

      fixture.componentRef.setInput('card', carte({key: 'hero-2', pivotId: 2, nom: 'Axel'}));
      await stable();

      expect(texte()).not.toContain('Raté');
    });

    it('la table rechargée (une carte identique mais neuve) ne perd pas le jet', async () => {
      await viser();
      await saisirAttaque('5');

      fixture.componentRef.setInput('card', carte());
      fixture.componentRef.setInput('target', {...cible});
      await stable();

      expect(texte()).toContain('Raté');
    });
  });

  describe('la main passe de case en case', () => {
    const focus = () => document.activeElement as HTMLElement;

    it('après un jet qui touche, au dé de dégâts ; puis au bouton qui applique', async () => {
      await viser();

      await saisirAttaque('8');
      expect(focus().getAttribute('aria-label')).toContain('Dé de dégâts');

      await saisirDegats('4');
      expect(focus().textContent).toContain('Appliquer');
    });

    it('après un coup raté, à « Fin du tour »', async () => {
      await viser();

      await saisirAttaque('5');

      expect(focus().textContent).toContain('Fin du tour');
    });

    it('après les dégâts, à « Fin du tour »', async () => {
      await viser();
      await saisirAttaque('8');
      await saisirDegats('4');

      await cliquer('Appliquer');

      expect(focus().textContent).toContain('Fin du tour');
    });

    it('une cible choisie donne la main à la case du jet', async () => {
      await rendre({targets: [cible]});
      element.querySelector<HTMLButtonElement>('.tas-cible button')!.click();

      fixture.componentRef.setInput('target', cible);
      fixture.componentRef.setInput('targetStats', stats({herosId: null, heroisme: null}));
      await stable();

      expect(focus().getAttribute('aria-label')).toContain('Total des deux dés');
    });

    it('« Changer d’adversaire » rend la main à la première carte', async () => {
      await viser();
      // La page retire la cible dès qu'on y renonce.
      fixture.componentInstance.targetSelected.subscribe(() => fixture.componentRef.setInput('target', null));

      await cliquer('Changer d’adversaire');

      expect(focus().closest('.tas-cible')).not.toBeNull();
    });

    it('la saisie de la protection prend la main', async () => {
      await viser();
      await saisirAttaque('8');

      await cliquer('Modifier la protection');

      expect(focus().getAttribute('aria-label')).toContain('Protection de la cible');
    });
  });

  describe('les réglages du coup', () => {
    it('le dé bonus du MJ passe à trois dés, et améliore les chances', async () => {
      await viser();
      const avant = element.querySelector('input[aria-label^="Total des deux dés"]')!.getAttribute('aria-label');

      await cliquer('Dé de bonus du MJ');

      expect(avant).not.toContain('gardés');
      expect(element.querySelector('input[aria-label^="Total des deux dés"]')!.getAttribute('aria-label')).toContain('gardés');
      expect(texte()).toContain('2d6B');
    });

    it('la posture offensive ajoute 1 à l’attaque', async () => {
      await viser();

      await cliquer('Offensive');

      expect(texte()).toContain('6+');
    });

    it('la défense totale n’a pas de jet : « Fin du tour » l’applique', async () => {
      await rendre();

      await cliquer('Déf. totale');
      expect(texte()).toContain('Pas d’attaque ce round');

      await cliquer('Fin du tour');
      expect(events.totalDefense).toEqual([false]);
      expect(events.endTurn).toEqual([]);
    });

    it('la défense totale renonce à la cible visée', async () => {
      await viser();

      await cliquer('Déf. totale');

      expect(events.target).toEqual([null]);
    });

    it('une arme lourde est interdite à qui a moins de 0 en vigueur', async () => {
      const lourde = arme(2, {arme: 'Grande hache', degats: 'd6B'});
      await viser({armes: [lourde, arme(1)], attacker: stats({vigueur: -1})});

      // L'épée est prise d'office : les dégâts restent ceux d'un d6.
      expect(texte()).toContain('Épée');
      expect(element.querySelector('[aria-label^="Grande hache"]')!.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('l’héroïsme de l’attaquant', () => {
    it('la faveur divine dépense un point et relance', async () => {
      await viser();
      await saisirAttaque('5');

      await cliquer('Faveur divine');

      expect(events.heroisme).toEqual([-1]);
      expect(texte()).not.toContain('Raté');
    });

    it('un coup qui touche s’achète en succès héroïque, et y renoncer rembourse', async () => {
      await viser();
      await saisirAttaque('8');

      await cliquer('Convertir en succès héroïque');
      expect(events.heroisme).toEqual([-1]);
      expect(texte()).toContain('Succès héroïque');

      await cliquer('Convertir en succès héroïque');
      expect(events.heroisme).toEqual([-1, 1]);
    });

    it('un double 1 accepté en échec critique rapporte un point', async () => {
      await viser();
      await saisirAttaque('2');

      await cliquer('Échec critique');

      expect(events.heroisme).toEqual([1]);
      expect(texte()).toContain('Échec critique');
    });

    it('refaire le jet rend ce que l’héroïsme avait coûté', async () => {
      await viser();
      await saisirAttaque('8');
      await cliquer('Convertir en succès héroïque');

      await saisirAttaque('5');

      expect(events.heroisme).toEqual([-1, 1]);
    });

    it('un coup dévastateur ajoute 6 aux dégâts', async () => {
      await viser();
      await saisirAttaque('12');

      await cliquer('Coup dévastateur');
      await saisirDegats('4');

      // 4 + 2 vigueur − 1 protection + 6.
      expect(texte()).toContain('= 11');
    });
  });

  describe('la réaction de la cible', () => {
    const heroCible = carte({key: 'hero-2', pivotId: 2, sourceId: 'h2', camp: 'adversaires', nom: 'Axel', heroisme: 1});

    it('une parade in extremis coûte un point à la cible et annule les dégâts', async () => {
      await viser({targets: [heroCible], target: heroCible, targetStats: stats({herosId: 'h2', heroisme: 1})});
      await saisirAttaque('8');

      await cliquer('Parade in extremis');

      expect(events.targetHeroisme).toEqual([{card: heroCible, delta: -1}]);
      expect(events.applied).toEqual([]);
      expect(texte()).toContain('Paré');
    });
  });

  describe('la horde', () => {
    const pietaille = (n: number) => carte({key: `pnj-${n}`, kind: 'pnj', camp: 'adversaires', pivotId: n, nom: `Squelette #${n}`, rang: 'Piétaille', joueur: null, heroisme: null});

    it('chaque piétaille qui se joint ajoute à l’attaque, et les dégâts deviennent d6M', async () => {
      const actif = pietaille(1);
      await rendre({
        card: actif,
        attacker: stats({heroisme: null, herosId: null}),
        armes: [],
        ownedArmes: [],
        combatOptions: [],
        hordeMates: [pietaille(2)],
        targets: [carte()],
        target: carte(),
        targetStats: stats(),
      });

      await cliquer('#2');

      expect(events.horde.at(-1)).toEqual(['pnj-2']);
      expect(texte()).toContain('d6M');
      expect(texte()).toContain('Horde');
    });
  });

  describe('la main qui passe', () => {
    const rideau = () => (fixture.nativeElement as HTMLElement).querySelector('bol-tas-attaquant bol-rideau')!;
    const copie = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.tas-head-fantome');

    it('rien au premier affichage, ni quand la table recharge la même carte', async () => {
      await rendre();
      expect(rideau().classList.contains('rdo--ferme')).toBe(false);

      fixture.componentRef.setInput('card', carte());
      await stable();

      expect(rideau().classList.contains('rdo--ferme')).toBe(false);
      expect(copie()).toBeNull();
    });

    it('une autre carte : l’ancienne reste en copie sous les flammes, et le nom du suivant s’annonce', async () => {
      await rendre();
      const avant = (fixture.nativeElement as HTMLElement).querySelector('.tas-head')!.textContent;

      fixture.componentRef.setInput('card', cible);
      await stable();

      expect(rideau().classList.contains('rdo--ferme')).toBe(true);
      expect(rideau().textContent).toContain(cible.nom);
      expect(copie()?.textContent).toBe(avant);
      expect(copie()?.getAttribute('aria-hidden')).toBe('true');
      expect(copie()?.inert).toBe(true);
      expect(copie()?.querySelector('[id]')).toBeNull();
    });

    it('moins d’animations : la carte change d’un coup, sans rideau', async () => {
      vi.stubGlobal('matchMedia', () => ({matches: true}));
      try {
        await rendre();

        fixture.componentRef.setInput('card', cible);
        await stable();

        expect(rideau().classList.contains('rdo--ferme')).toBe(false);
        expect(copie()).toBeNull();
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('la carte reprend sa place une fois le passage fini', async () => {
      await rendre();
      vi.useFakeTimers();
      try {
        fixture.componentRef.setInput('card', cible);
        TestBed.tick();
        expect(copie()).not.toBeNull();

        vi.advanceTimersByTime(850);
        expect(copie()).toBeNull();

        vi.advanceTimersByTime(700);
        TestBed.tick();
        expect(rideau().classList.contains('rdo--ferme')).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('la vitalité sur le cœur', () => {
    it('une correction est signalée à la page, d’un pas à la fois', async () => {
      await viser();

      element.querySelector<HTMLButtonElement>('.tas-vit dw-value-stepper button')!.click();
      await stable();

      expect(events.vitalite).toEqual([{card: carte(), delta: -1}]);
    });
  });
});
