import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {BolArmeModel, BolHerosArmeModel} from '../../../models/bol-arme.model';
import {BolCombatOptionModel} from '../../../models/bol-combat-reference.model';
import {AppliedHit, HeroismeChange, ResolvedCombatStats, VitaliteChange} from '../../models/combat-attack.model';
import {TapisCard} from '../../models/tapis.model';
import {RessourceChange, RessourcesMagiques, SortSaisie} from '../../models/magie-combat.model';
import {AttackChoice} from '../../models/attack-options.model';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {effetDeFoi} from './combat-effects.util';
import {effetSortPaye, saisieSortParDefaut} from '../../magie-combat.util';
import {MatDialog} from '@angular/material/dialog';
import {MatTooltip} from '@angular/material/tooltip';
import {of} from 'rxjs';
import {TurnAssistantComponent} from './turn-assistant';
import {MassacrePietailleDialogData} from '../../models/massacre-pietaille-dialog.model';

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
    ressources: [] as RessourceChange[],
    nouveaux: [] as NewEffect[],
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
    c.ressourceAdjusted.subscribe((v) => events.ressources.push(v));
    c.effectAdded.subscribe((v) => events.nouveaux.push(v));
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

  describe('l’arme favorite', () => {
    const tuile = (label: string) =>
      [...element.querySelectorAll<HTMLElement>('bol-tas-attaquant .tas-tile')].find((t) => t.querySelector('span')?.textContent?.trim() === label);

    it('marque d’une étoile la tuile d’attaque, qui dit son dé de bonus en infobulle, sans phrase sous les chiffres', async () => {
      await rendre({attacker: stats({armeFavorite: 'Épée'})});

      const attaque = tuile('Attaque')!;
      expect(attaque.classList).toContain('tas-tile--note');
      expect(attaque.querySelector('.sr-only')?.textContent).toBe('Arme favorite (Épée) : dé de bonus avec cette arme.');
      expect(fixture.debugElement.query((d) => d.nativeElement === attaque).injector.get(MatTooltip).message).toBe(
        'Agilité +1, mêlée +2 · Arme favorite (Épée) : dé de bonus avec cette arme.',
      );
      expect(tuile('Dégâts')!.classList).not.toContain('tas-tile--note');
      expect(element.querySelector('.tas-head-notes')?.textContent ?? '').not.toContain('Arme favorite');
    });

    it('rien avec une autre arme', async () => {
      await rendre({attacker: stats({armeFavorite: 'Hache'})});

      expect(tuile('Attaque')!.classList).not.toContain('tas-tile--note');
      expect(tuile('Attaque')!.querySelector('.sr-only')).toBeNull();
    });
  });

  describe('une carte sans arme', () => {
    it('la carte des dégâts n’apparaît qu’une fois le jet d’attaque fait', async () => {
      const carte = () => (fixture.nativeElement as HTMLElement).querySelector('li[bol-tas-degats]');

      await viser();
      expect(carte()).toBeNull();
      expect(texte()).not.toContain('Après un coup qui touche');

      await saisirAttaque('8');
      expect(carte()).not.toBeNull();
    });

    it('avant même de viser, pas de carte des dégâts', async () => {
      await rendre();

      expect((fixture.nativeElement as HTMLElement).querySelector('li[bol-tas-degats]')).toBeNull();
    });

    it('un coup raté garde la carte, avec « Fin du tour »', async () => {
      await viser();

      await saisirAttaque('2');

      expect((fixture.nativeElement as HTMLElement).querySelector('li[bol-tas-degats]')?.textContent).toContain('Pas de dégâts : le coup est raté.');
      expect(bouton('Fin du tour')).toBeDefined();
    });

    it('la fourchette des dégâts n’est dite qu’une fois : dans leur addition, pas en tête de carte', async () => {
      await viser();

      await saisirAttaque('8');

      const carte = (fixture.nativeElement as HTMLElement).querySelector('li[bol-tas-degats]')!;
      expect(carte.querySelector('.tas-goal')).toBeNull();
      expect(carte.querySelector('dw-roll-sum')?.textContent).toMatch(/\d+ à \d+/);
    });

    it('une créature frappe d’une case comme les armes : une patte, ses dégâts dessous', async () => {
      await rendre({card: carte({kind: 'creature', degats: 'd6B'}), armes: [], ownedArmes: []});

      const zone = element.querySelector('.tas-zone--armes')!;
      const cas = zone.querySelector('.tas-pick--fige');
      expect(cas?.getAttribute('aria-label')).toBe('Dégâts, d6B');
      expect(cas?.querySelector('mat-icon')?.textContent?.trim()).toBe('pets');
      expect(cas?.querySelector('em')?.textContent?.trim()).toBe('d6B');
    });

    it('un démon frappe avec son icône de démon', async () => {
      await rendre({card: carte({kind: 'demon', degats: 'd6+1'}), armes: [], ownedArmes: []});

      expect(element.querySelector('.tas-zone--armes .tas-pick--fige mat-icon')?.textContent?.trim()).toBe('bolt');
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

    it('le coup joué garde la case de son arme, sélectionnée et figée, au lieu d’une plaque', async () => {
      await viser();
      await saisirAttaque('8');
      await saisirDegats('4');

      await cliquer('Appliquer');

      const zone = element.querySelector('.tas-zone--armes')!;
      expect(zone.querySelector('.tas-played')).toBeNull();
      const fige = zone.querySelector('.tas-pick--fige');
      expect(fige?.getAttribute('aria-label')).toMatch(/, d\d/);
      expect(zone.querySelector('button')).toBeNull();
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

  describe('les options de succès héroïque', () => {
    it('Carnage pris deux fois : la première attaque ratée, la seconde reste due', async () => {
      await viser();
      await saisirAttaque('12');
      await cliquer('Succès légendaire');
      await cliquer(/^\s*Carnage/);
      await cliquer(/^\s*Carnage/);
      await saisirDegats('4');
      await cliquer('Appliquer');

      await saisirAttaque('5');
      expect(texte()).toContain('le Carnage donne encore 1 attaque');
      await cliquer('Attaque suivante (Carnage)');
      expect(texte()).not.toContain('Raté');

      await saisirAttaque('5');
      expect(texte()).not.toContain('le Carnage donne encore');
      await cliquer('Fin du tour');
      expect(events.endTurn).toEqual([false]);
    });

    it('le renversement est interdit contre une cible trop grande, et l’infobulle dit pourquoi', async () => {
      const troll = carte({key: 'creature-3', kind: 'creature', camp: 'adversaires', pivotId: 3, nom: 'Troll', rang: 'Coriace', taille: 6, joueur: null, heroisme: null});
      await viser({targets: [troll], target: troll, targetStats: stats({herosId: null, heroisme: null, arme: false})});
      await saisirAttaque('12');

      const renversement = bouton(/Renversement/);
      expect(renversement.getAttribute('aria-disabled')).toBe('true');
      expect(renversement.getAttribute('aria-label')).toContain('dépasse Grimar');
      expect(bouton(/Désarmement/).getAttribute('aria-disabled')).toBe('true');
      renversement.click();
      await stable();
      expect(renversement.getAttribute('aria-pressed')).toBe('false');
      expect(bouton(/Coup dévastateur/).getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('la parade in extremis', () => {
    const heroCible = carte({key: 'hero-2', pivotId: 2, sourceId: 'h2', camp: 'adversaires', nom: 'Axel', heroisme: 1});
    const segment = (nom: string) => [...element.querySelectorAll<HTMLButtonElement>('.tas-seg')].find((b) => (b.textContent ?? '').trim() === nom);

    it('avec un bouclier et une arme, le MJ choisit ce qui est brisé', async () => {
      await viser({targets: [heroCible], target: heroCible, targetStats: stats({herosId: 'h2', heroisme: 1, bouclier: true, arme: true})});
      await saisirAttaque('8');
      expect(segment('Bouclier')!.getAttribute('aria-pressed')).toBe('true');

      segment('Arme')!.click();
      await stable();
      await cliquer('Parade in extremis');

      expect(events.effects).toEqual(['arme-brisee']);
      expect(texte()).toContain('son arme, qui est brisée');
    });

    it('le choix « Arme » tient quand les statistiques de la cible sont relues (table enregistrée, héroïsme ajusté)', async () => {
      await viser({targets: [heroCible], target: heroCible, targetStats: stats({herosId: 'h2', heroisme: 1, bouclier: true, arme: true})});
      await saisirAttaque('8');
      segment('Arme')!.click();
      await stable();

      // La table rechargée relit la fiche de la cible : mêmes objets en main, mais un objet neuf.
      fixture.componentRef.setInput('targetStats', stats({herosId: 'h2', heroisme: 1, bouclier: true, arme: true}));
      fixture.componentRef.setInput('target', {...heroCible});
      await stable();

      expect(segment('Arme')!.getAttribute('aria-pressed')).toBe('true');
    });

    it('le choix revient au bouclier pour un nouveau défenseur, ou quand l’arme n’est plus possible', async () => {
      const autre = carte({key: 'hero-3', pivotId: 3, sourceId: 'h3', camp: 'adversaires', nom: 'Brunn', heroisme: 1});
      await viser({targets: [heroCible, autre], target: heroCible, targetStats: stats({herosId: 'h2', heroisme: 1, bouclier: true, arme: true})});
      await saisirAttaque('8');
      segment('Arme')!.click();
      await stable();

      // Désarmé entre-temps : l'arme n'est plus possible, le bouclier reprend.
      fixture.componentRef.setInput('targetStats', stats({herosId: 'h2', heroisme: 1, bouclier: true, arme: false}));
      await stable();
      fixture.componentRef.setInput('targetStats', stats({herosId: 'h2', heroisme: 1, bouclier: true, arme: true}));
      await stable();
      expect(segment('Bouclier')!.getAttribute('aria-pressed')).toBe('true');

      segment('Arme')!.click();
      await stable();
      fixture.componentRef.setInput('target', autre);
      fixture.componentRef.setInput('targetStats', stats({herosId: 'h3', heroisme: 1, bouclier: true, arme: true}));
      await stable();
      await saisirAttaque('8');
      expect(segment('Bouclier')!.getAttribute('aria-pressed')).toBe('true');
    });

    it('sans arme en main, son bouclier, sans choix', async () => {
      await viser({targets: [heroCible], target: heroCible, targetStats: stats({herosId: 'h2', heroisme: 1, bouclier: true, arme: false})});
      await saisirAttaque('8');
      expect(segment('Arme')).toBeUndefined();
      await cliquer('Parade in extremis');
      expect(events.effects).toEqual(['sans-bouclier']);
    });
  });

  describe('massacrer la piétaille', () => {
    const bandit = (n: number) => carte({key: `pnj-${n}`, kind: 'pnj', camp: 'adversaires', pivotId: n, nom: `Bandit #${n}`, rang: 'Piétaille', joueur: null, heroisme: null, vitaliteCourante: 2, vitaliteMax: 2});

    it('propose qui tombe, la cible d’abord, et met hors de combat ceux que le MJ garde', async () => {
      let recu: MassacrePietailleDialogData | null = null;
      TestBed.overrideProvider(MatDialog, {
        useValue: {
          open: (_: unknown, config: {data: MassacrePietailleDialogData}) => {
            recu = config.data;
            return {afterClosed: () => of({tombes: ['pnj-6', 'pnj-5']})};
          },
        },
      });
      await viser({targets: [bandit(5), bandit(6), bandit(7)], target: bandit(6), targetStats: stats({herosId: null, heroisme: null})});
      await saisirAttaque('12');
      await cliquer('Massacrer la piétaille');
      await saisirDegats('2');
      await cliquer('Appliquer');

      // 2 au dé, +2 vigueur, −1 protection : 3 piétailles.
      expect(recu!.degats).toBe(3);
      expect(recu!.candidats.map((c) => c.key)).toEqual(['pnj-6', 'pnj-5', 'pnj-7']);
      expect(events.applied.map((hit) => [hit.target.key, hit.damage])).toEqual([
        ['pnj-6', 2],
        ['pnj-5', 2],
      ]);
      expect(texte()).toContain('2 hors de combat');
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
      // Un MediaQueryList complet : le BreakpointObserver du CDK s'y abonne aussi
      vi.stubGlobal('matchMedia', (media: string) => ({matches: true, media, addListener: () => undefined, removeListener: () => undefined}));
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

  describe('la sorcellerie (livre p. 148-153)', () => {
    const magie = (over: Partial<RessourcesMagiques> = {}): RessourcesMagiques => ({
      esprit: 2,
      foi: null,
      pouvoir: 12,
      sorcier: 2,
      surcoutArmure: 1,
      magieRoisSorciers: false,
      resistantMagie: false,
      ...over,
    });
    const sorcier = (over: Partial<RessourcesMagiques> = {}) => stats({magie: magie(over)});
    const cibleEsprit = (esprit: number) => stats({herosId: null, heroisme: null, magie: {...magie(), esprit, pouvoir: null, sorcier: null}});

    it('un sorcier lance un sort au lieu d’attaquer : 2d6 + esprit + sorcier, et le premier jet paie le sort, armure comprise', async () => {
      await viser({attacker: sorcier()});
      await cliquer(/^ *Sort *null$/);

      // 1er cercle : 5 points, +1 pour l'armure légère ; +2 esprit, +2 sorcier, Moyenne : il faut 5 aux dés.
      expect(texte()).toContain('6 pts de pouvoir');
      expect(texte()).toContain('5+');
      await saisirAttaque('6');

      expect(texte()).toContain('Le sort agit');
      expect(events.ressources).toEqual([{card: carte(), ressource: 'pouvoir', delta: -6}]);
      expect(events.rolled).toEqual([]);
      expect(texte()).toContain('Le sort ne blesse pas');
      await cliquer('Fin du tour');
      expect(events.endTurn).toEqual([false]);
    });

    it('un sort qui blesse passe aux dégâts : d6, sans vigueur ni protection', async () => {
      await viser({attacker: sorcier()});
      await cliquer(/^ *Sort *null$/);
      await cliquer('Blesse');
      await saisirAttaque('7');
      await saisirDegats('4');

      expect(texte()).toContain('4 dégâts');
      await cliquer('Appliquer 4');
      expect(events.applied).toEqual([{target: cible, damage: 4, unarmed: false}]);
      await cliquer('Fin du tour');
      expect(events.endTurn).toEqual([false]);
    });

    it('un sort sur l’esprit retranche l’esprit de la cible', async () => {
      await viser({attacker: sorcier(), targetStats: cibleEsprit(3)});
      await cliquer(/^ *Sort *null$/);
      await cliquer('Sur l’esprit');

      // +2 +2 −3 : il faut 8 aux dés.
      expect(texte()).toContain('8+');
      expect(texte()).toContain('esprit de Kalzatan');
    });

    it('un sort raté dépense le pouvoir ; vider la case avant de le valider le rend', async () => {
      await viser({attacker: sorcier()});
      await cliquer(/^ *Sort *null$/);
      await saisirAttaque('3');

      expect(texte()).toContain('Le sort échoue');
      await saisirAttaque('');
      expect(events.ressources.map((r) => r.delta)).toEqual([-6, 6]);
    });

    it('sans assez de pouvoir, le jet reste fermé', async () => {
      await viser({attacker: sorcier({pouvoir: 4})});
      await cliquer(/^ *Sort *null$/);

      expect(texte()).toContain('Pas assez de pouvoir');
      expect(element.querySelector<HTMLInputElement>('input[aria-label^="Total des deux dés du sort"]')!.disabled).toBe(true);
    });

    it('le 2e cercle coûte 10 points, et une condition en plus en retire 1', async () => {
      await viser({attacker: sorcier({surcoutArmure: 0})});
      await cliquer(/^ *Sort *null$/);
      await cliquer('2e cercle');
      expect(texte()).toContain('10 pts de pouvoir');
      expect(texte()).toContain('Difficile');

      element.querySelector<HTMLButtonElement>('.tas-sortf-cond dw-value-stepper button:last-of-type')!.click();
      await stable();
      expect(texte()).toContain('9 pts de pouvoir');
    });

    const caseSort = () => element.querySelector<HTMLInputElement>('input[aria-label^="Total des deux dés du sort"]')!;
    const desDuSort = /d6 à l’écran pour/;

    it('un échec critique accepté se défait quand le total est retapé : le point d’héroïsme est repris', async () => {
      await viser({attacker: sorcier()});
      await cliquer(/^ *Sort *null$/);
      // « 2 » se lit comme un double 1 : le sort échoue, le héros peut en faire un échec critique.
      await saisirAttaque('2');
      await cliquer('Échec critique : gagner 1 point d’héroïsme');
      expect(events.heroisme).toEqual([1]);

      await saisirAttaque('3');

      expect(events.heroisme).toEqual([1, -1]);
      expect(texte()).not.toContain('Échec critique');
      expect(texte()).toContain('Le sort échoue');
      // Le sort n'est pas repayé.
      expect(events.ressources.map((r) => r.delta)).toEqual([-6]);
    });

    it('les dégâts du sort appliqués, sa case se fige : la vider ne rend pas le pouvoir et ne rouvre pas les dégâts', async () => {
      await viser({attacker: sorcier()});
      await cliquer(/^ *Sort *null$/);
      await cliquer('Blesse');
      await saisirAttaque('7');
      await saisirDegats('4');
      await cliquer('Appliquer 4');

      expect(caseSort().disabled).toBe(true);
      expect(bouton(desDuSort).disabled).toBe(true);
      await saisirAttaque('');
      await saisirAttaque('8');

      expect(events.ressources.map((r) => r.delta)).toEqual([-6]);
      expect(element.querySelector('input[aria-label^="Dé de dégâts"]')).toBeNull();
      expect(events.applied).toHaveLength(1);
    });

    it('en défense totale, pas de sort : sa case reste fermée', async () => {
      await viser({attacker: sorcier()});
      await cliquer(/^ *Sort *null$/);
      await cliquer('Déf. totale');

      expect(texte()).toContain('Pas de sort ce round');
      expect(element.querySelector('li[bol-tas-degats]')).toBeNull();
      expect(element.querySelector('input[aria-label^="Total des deux dés du sort"]')).toBeNull();
      expect(events.ressources).toEqual([]);
    });

    it('la même carte qui rejoue au round suivant (elle avait retardé) repart d’un tour neuf : son sort n’est plus payé', async () => {
      await viser({attacker: sorcier(), round: 1});
      await cliquer(/^ *Sort *null$/);
      await cliquer('Blesse');
      await saisirAttaque('7');
      await saisirDegats('4');
      await cliquer('Appliquer 4');

      fixture.componentRef.setInput('round', 2);
      await stable();

      expect(texte()).not.toContain('· payé');
      expect(texte()).toContain('L’attaque');
      await cliquer(/^ *Sort *null$/);
      expect(caseSort().disabled).toBe(false);
      await saisirAttaque('7');
      expect(events.ressources.map((r) => r.delta)).toEqual([-6, -6]);
    });

    it('un sort raté relancé à l’écran est un nouveau sort : il se paie de nouveau ; la faveur divine relance sans le repayer', async () => {
      // Tous les dés à 1 : double 1, le sort échoue.
      const hasard = vi.spyOn(Math, 'random').mockReturnValue(0);
      try {
        await viser({attacker: sorcier()});
        await cliquer(/^ *Sort *null$/);
        await cliquer(desDuSort);
        expect(texte()).toContain('Le sort échoue');
        expect(events.ressources.map((r) => r.delta)).toEqual([-6]);

        await cliquer(desDuSort);
        expect(events.ressources.map((r) => r.delta)).toEqual([-6, -6]);

        await cliquer('Faveur divine');
        await cliquer(desDuSort);
        expect(events.heroisme).toEqual([-1]);
        expect(events.ressources.map((r) => r.delta)).toEqual([-6, -6]);
      } finally {
        hasard.mockRestore();
      }
    });

    it('sans de quoi payer un nouveau sort, les dés ne se relancent plus après un résultat', async () => {
      const hasard = vi.spyOn(Math, 'random').mockReturnValue(0);
      try {
        await viser({attacker: sorcier({pouvoir: 6})});
        await cliquer(/^ *Sort *null$/);
        await cliquer(desDuSort);
        // La page a enregistré le débit : il ne lui reste rien.
        fixture.componentRef.setInput('attacker', sorcier({pouvoir: 0}));
        await stable();

        expect(bouton(desDuSort).disabled).toBe(true);
        expect(events.ressources.map((r) => r.delta)).toEqual([-6]);
      } finally {
        hasard.mockRestore();
      }
    });

    it('changer d’adversaire après le jet du sort le remet à zéro, comme l’attaque : le sort lancé est perdu, un nouveau se paie', async () => {
      const autre = carte({key: 'pnj-8', kind: 'pnj', camp: 'adversaires', pivotId: 8, sourceId: '16', nom: 'Thurgal', joueur: null, heroisme: null});
      await viser({attacker: sorcier(), targets: [cible, autre]});
      await cliquer(/^ *Sort *null$/);
      await cliquer('Blesse');
      await saisirAttaque('7');
      // La page renvoie la trace du sort payé, enregistrée dans l'état du combat.
      const trace = events.nouveaux.find((effet) => effet.origine === 'sort-paye');
      expect(trace).toBeDefined();
      fixture.componentRef.setInput('effets', [{...trace!, id: 'e-1'}]);
      await stable();

      await cliquer('Changer d’adversaire');
      fixture.componentRef.setInput('target', null);
      await stable();
      fixture.componentRef.setInput('target', autre);
      await stable();

      expect(element.querySelector('input[aria-label^="Dé de dégâts"]')).toBeNull();
      expect(texte()).not.toContain('Le sort agit');
      expect(texte()).not.toContain('· payé');
      expect(events.removed).toEqual(['e-1']);
      expect(texte()).toContain('le sort lancé contre l’ancienne cible est perdu');
      // Il a coûté l'action : pas d'attaque à la place.
      expect(bouton(/^ *Attaque *null$/).disabled).toBe(true);
      await saisirAttaque('7');
      expect(events.ressources.map((r) => r.delta)).toEqual([-6, -6]);
    });

    it('le sort payé laisse une trace dans l’état du combat, et la vider la retire avec le remboursement', async () => {
      await viser({attacker: sorcier()});
      await cliquer(/^ *Sort *null$/);
      await saisirAttaque('3');

      expect(events.nouveaux).toEqual([effetSortPaye('hero-1', 6, saisieSortParDefaut())]);
      fixture.componentRef.setInput('effets', [{...effetSortPaye('hero-1', 6, saisieSortParDefaut()), id: 'e-1'}]);
      await stable();
      await saisirAttaque('');
      expect(events.ressources.map((r) => r.delta)).toEqual([-6, 6]);
      expect(events.removed).toEqual(['e-1']);
    });

    it('la page rechargée en plein tour après un sort payé : l’assistant le dit, et le jet ne redébite pas', async () => {
      // Le pouvoir est déjà débité (il ne lui reste rien) ; l'assistant, neuf, ne sait du sort que sa trace.
      await viser({attacker: sorcier({pouvoir: 0}), round: 2, effets: [{...effetSortPaye('hero-1', 6, saisieSortParDefaut()), id: 'e-1'}]});

      expect(texte()).toContain('6 pts déjà payés ce tour-ci');
      expect(texte()).not.toContain('Pas assez de pouvoir');
      expect(bouton(/^ *Attaque *null$/).disabled).toBe(true);
      await saisirAttaque('7');

      expect(texte()).toContain('Le sort agit');
      expect(events.ressources).toEqual([]);
    });

    it('rechargée, un sort plus cher ne débite que la différence', async () => {
      await viser({attacker: sorcier({pouvoir: 10}), effets: [{...effetSortPaye('hero-1', 6, saisieSortParDefaut()), id: 'e-1'}]});
      await cliquer('2e cercle');
      // 10 + 1 pour l'armure : 5 de plus que les 6 déjà payés.
      await saisirAttaque('9');

      expect(events.ressources.map((r) => r.delta)).toEqual([-5]);
      expect(events.removed).toEqual(['e-1']);
      expect(events.nouveaux).toEqual([effetSortPaye('hero-1', 11, {...saisieSortParDefaut(), cercle: 2, difficulte: 'difficile'})]);
    });

    it('rechargée, l’assistant revient sur le sort tel qu’il était réglé : puissance, difficulté, conditions, blesse, sur l’esprit', async () => {
      const reglage: SortSaisie = {cercle: 2, difficulte: 'tres-difficile', conditions: 3, coutCharme: 1, blessant: true, espritCible: true};
      await viser({attacker: sorcier({pouvoir: 0}), targetStats: cibleEsprit(1), effets: [{...effetSortPaye('hero-1', 10, reglage), id: 'e-1'}]});

      const presse = (libelle: string | RegExp) => bouton(libelle).getAttribute('aria-pressed');
      expect(presse('2e cercle')).toBe('true');
      expect(texte()).toContain('Très difficile');
      expect(element.querySelector<HTMLInputElement>('.tas-sortf-cond input')?.value).toBe('3');
      expect(presse('Blesse')).toBe('true');
      expect(presse('Sur l’esprit')).toBe('true');
      // 10 − 2 (conditions) + 1 (armure) : 9 points, couverts par les 10 déjà payés.
      expect(texte()).toContain('9 pts de pouvoir');
      await saisirAttaque('12');
      expect(events.ressources).toEqual([]);
    });

    it('un sort n’est pas une attaque (livre p. 65 et 148) : la posture choisie ne pèse ni sur sa défense ni sur son jet', async () => {
      const choix: (AttackChoice | null)[] = [];
      await viser({attacker: sorcier()});
      fixture.componentInstance.choiceChanged.subscribe((c) => choix.push(c));
      const defense = () => [...element.querySelectorAll('bol-tas-attaquant .tas-tile')].find((t) => t.querySelector('span')?.textContent?.trim() === 'Défense')?.querySelector('b')?.textContent?.trim();
      await cliquer('Offensive');
      expect(choix.at(-1)?.posture?.slug).toBe('offensive');
      expect(defense()).toBe('0');

      await cliquer(/^ *Sort *null$/);

      expect(choix.at(-1)?.posture ?? null).toBeNull();
      expect(defense()).toBe('1');
      expect(bouton('Défensive').getAttribute('aria-disabled')).toBe('true');
      await cliquer('Défensive');
      expect(choix.at(-1)?.posture ?? null).toBeNull();
      // Revenu à l'attaque, sa posture compte de nouveau.
      await cliquer(/^ *Attaque *null$/);
      expect(choix.at(-1)?.posture?.slug).toBe('offensive');
    });

    it('la trace d’une autre carte ne vaut rien pour ce tour', async () => {
      await viser({attacker: sorcier(), effets: [{...effetSortPaye('pnj-7', 6, saisieSortParDefaut()), id: 'e-1'}]});
      await cliquer(/^ *Sort *null$/);
      await saisirAttaque('7');

      expect(events.ressources.map((r) => r.delta)).toEqual([-6]);
    });

    it('une carte sans pouvoir n’a pas de sort', async () => {
      await viser();

      expect(() => bouton(/^ *Sort *null$/)).toThrow();
    });
  });

  describe('la foi (livre p. 146)', () => {
    it('un prêtre donne un dé de bonus : le dé attend la prochaine action, et 1 point de foi est dépensé', async () => {
      await viser({attacker: stats({magie: {esprit: 1, foi: 2, pouvoir: null, sorcier: null, surcoutArmure: 0, magieRoisSorciers: false, resistantMagie: false}}), visibles: [carte(), cible]});
      expect(texte()).toContain('Foi');

      await cliquer('Dé de foi');
      const item = (libelle: string) => [...document.querySelectorAll<HTMLButtonElement>('[mat-menu-item]')].find((b) => (b.textContent ?? '').includes(libelle))!;
      item('Dé de malus à').click();
      await stable();
      item('Kalzatan').click();
      await stable();

      expect(events.nouveaux).toEqual([effetDeFoi('pnj-7', 'malus', 'Grimar')]);
      expect(events.ressources).toEqual([{card: carte(), ressource: 'foi', delta: -1}]);
    });

    it('un prêtre visé impose son dé de malus avant le jet de son agresseur, pas après : le dé de foi se ferme, et dit pourquoi', async () => {
      const pretre = stats({herosId: null, heroisme: null, magie: {esprit: 1, foi: 2, pouvoir: null, sorcier: null, surcoutArmure: 0, magieRoisSorciers: false, resistantMagie: false}});
      await viser({targetStats: pretre, visibles: [carte(), cible]});
      expect(bouton('Dé de foi').getAttribute('aria-disabled')).toBeNull();

      await saisirAttaque('7');

      const deFoi = bouton('Dé de foi');
      expect(deFoi.getAttribute('aria-disabled')).toBe('true');
      expect(deFoi.getAttribute('aria-label')).toContain('avant le jet');
      deFoi.click();
      await stable();
      expect(document.querySelectorAll('[mat-menu-item]').length).toBe(0);
      // Le jet effacé, il peut de nouveau l'imposer.
      await saisirAttaque('');
      expect(bouton('Dé de foi').getAttribute('aria-disabled')).toBeNull();
    });

    it('un dé de foi dû entre dans le jet d’attaque, en plus du dé du MJ', async () => {
      const effets: CombatEffect[] = [{...effetDeFoi('hero-1', 'bonus', 'Bellys'), id: 'e-1'}];
      await viser({effets});

      expect(texte()).toContain('Foi : 1 dé de bonus à cette action.');
      expect(texte()).toContain('2d6B');
      await cliquer('Dé de bonus du MJ');
      expect(element.querySelector('input[aria-label^="Total des deux dés"]')?.getAttribute('aria-label')).toContain('gardés');
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
