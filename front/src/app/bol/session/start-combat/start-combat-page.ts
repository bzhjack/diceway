import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  untracked,
  ViewEncapsulation,
  viewChild,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import {A11yModule} from '@angular/cdk/a11y';
import {CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition} from '@angular/cdk/overlay';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {firstValueFrom, forkJoin, Observable, of, switchMap, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {DiceBoxHostComponent} from '../../../shared/dice-3d/dice-box-host';
import {BolFightSessionModel, InitiativeResultat} from '../../models/bol-fight-session.model';
import {AmbushState} from '../../models/combat-selection.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {BolHerosService} from '../../services/bol-heros.service';
import {DwDiceRowComponent} from '../../../shared/dice-row/dice-row';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {heroStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {DiceRowDie} from '../../../shared/models/dice-row.model';
import {actionDiceTarget, actionDiceTargetLabel, actionSuccessChance, keptDiceIndexes, parseDiceTotal} from '../action-roll.util';
import {applyHeroismeDelta} from '../heroisme-spend.util';
import {ActionDiceTargetLabel, ActionRollCarriere, RollSumTerm} from '../models/action-roll.model';
import {heroDetails} from '../play/tapis/tapis.util';
import {CombatEffect} from '../models/combat-effect.model';
import {InitiativeKind} from '../models/initiative.model';
import {appliquerEvenement, effetSurpris, idAleatoire} from '../play/tapis/combat-effects.util';
import {ReactionAdversary, ReactionGroup, ReactionParts, ReactionVerdict, StartCombatContext} from '../models/start-combat.model';
import {REACTION_ROLL_THRESHOLD, reactionDiceNet, reactionLanes, reactionModifier, reactionResult, reactionSumTerms, reactionVerdict} from '../reaction-roll.util';
import {AddCombatantDialogComponent} from '../play/add-combatant-dialog/add-combatant-dialog';
import {pnjAvatar} from '../combat-play.util';

/** Un PNJ, une créature ou un démon tel que la page le charge : ce que l'ordre d'action en montre, plus son initiative. */
interface AdversaryRow extends Omit<ReactionAdversary, 'excluded'> {
  /** Initiative : celle d'un PNJ ; les créatures et démons n'en ont pas (0). */
  readonly initiative: number;
}

interface HeroRow {
  readonly pivotId: number;
  readonly herosId: string;
  readonly nom: string;
  readonly avatar: string | null;
  /** Résultat de son jet de réaction, `null` tant qu'il n'a pas lancé. Affiché tout de suite, puis envoyé au serveur. */
  readonly resultat: InitiativeResultat | null;
  readonly esprit: number;
  /** Initiative effective, malus de l'équipement compris : c'est elle qui entre dans le jet. */
  readonly initiative: number;
  /** Malus d'initiative de l'équipement (casque) : 0 ou négatif. */
  readonly initiativeEquipement: number;
  /** Agilité du héros, sans le malus de son armure : elle n'entre pas dans le jet, elle départage les héros de même résultat. */
  readonly agilite: number;
  /** Ses carrières de rang 1 ou plus : le MJ peut en accorder une, utile à la réaction. */
  readonly carrieres: readonly ActionRollCarriere[];
  /** Sa fiche complète : le portrait de la carte ouvre son statbloc. */
  readonly fiche: BolHerosModel;
  /** Dés de bonus (positif, « Vigilant ») ou de malus (négatif, « Lent à la détente ») à son jet de réaction : il lance 2 + |n| dés et
   * garde les deux meilleurs ou les deux moins bons. */
  readonly diceNet: number;
}

/** La carte d'un héros, prête à afficher : ce qu'il lui faut aux dés, ses chances, son jet et son verdict. */
interface HeroCard {
  readonly hero: HeroRow;
  /** Son portrait, `null` s'il n'en a pas : son initiale le remplace. */
  readonly avatar: string | null;
  readonly excluded: boolean;
  readonly target: ActionDiceTargetLabel;
  readonly chance: number;
  /** Total de ses deux dés, `null` avant son jet. */
  readonly dice: number | null;
  /** Les faces de ses dés, quand on les connaît : lancés à l'écran (le dé écarté par un bonus ou un malus est marqué), ou un double 1
   * ou double 6 tapé ; `null` sinon. */
  readonly faces: readonly DiceRowDie[] | null;
  /** Combien de dés il lance : 2, ou 3 et plus avec un dé de bonus ou de malus. Avant le jet, autant de places vides. */
  readonly diceCount: number;
  /** Ses dés de bonus (positif) ou de malus (négatif), trait et MJ réunis. */
  readonly diceNet: number;
  /** Ces dés en clair, sous ce qu'il lui faut (« dé de malus », « 2 dés de bonus ») ; `null` sans. */
  readonly diceLabel: string | null;
  /** Le dé de bonus (1) ou de malus (−1) accordé par le MJ pour ce jet, en plus de celui du trait ; `null` sans. */
  readonly gmDie: 1 | -1 | null;
  /** Combien de modificateurs le MJ a accordés (dé du MJ, carrière) : le nombre sur le bouton « Modificateurs ». */
  readonly modsCount: number;
  /** Le trait qui lui donne un dé de bonus ou de malus, rappelé en tête du popover des modificateurs ; `null` sans. */
  readonly traitNote: string | null;
  /** Le calcul du jet en une ligne (« 3d6 +1 esprit −2 ennemi ≥ 9 »), en infobulle sur ce qu'il lui faut. */
  readonly formula: string;
  readonly verdict: ReactionVerdict | null;
  readonly sum: readonly RollSumTerm[];
  /** Option d'héroïsme ouverte par son jet : l'échec critique sur un double 1 (+1 point), le succès légendaire sur un double 6 (−1),
   * le succès héroïque sur une réussite (−1). */
  readonly option: 'critique' | 'legendaire' | 'heroique' | null;
  /** La carrière accordée pour ce jet, `null` sinon. */
  readonly career: ActionRollCarriere | null;
  readonly optionChosen: boolean;
  /** Faveur divine possible : un échec (double 1 compris, tant que l'échec critique n'est pas choisi) et au moins 1 point d'héroïsme. */
  readonly favor: boolean;
  /** Ses points d'héroïsme. */
  readonly heroisme: number;
  /** Ses points d'héroïsme en gemmes : cinq au moins (la limite habituelle), allumées jusqu'à son nombre de points. */
  readonly gems: readonly boolean[];
  /** Faveur divine dépensée sur des dés lancés à table : ils sont à relancer, et le nouveau total à taper. */
  readonly favorPending: boolean;
}

/** Le trait qui donne au héros un dé de bonus ou de malus au jet de réaction, rappelé à la fin de son calcul. */
const TRAIT_DIE: Readonly<Record<number, string>> = {1: ' · Vigilant : un dé de bonus', [-1]: ' · Lent à la détente : un dé de malus'};

/** Embuscade (02-actions-combat.md, « Modificateurs au jet de réaction ») : la tendre ou surprendre l'ennemi donne +2 (Très facile),
 * être surpris ou pris en embuscade donne −1 (Ardue). */
const AMBUSH_OPTIONS: readonly {readonly value: AmbushState; readonly label: string; readonly bonus: string; readonly modifier: number}[] = [
  {value: null, label: 'Aucune', bonus: '', modifier: 0},
  {value: 'heroes_ambush', label: 'Tendue par les héros', bonus: '+2', modifier: 2},
  {value: 'heroes_ambushed', label: 'Héros surpris', bonus: '−1', modifier: -1},
];

/**
 * La page « Démarrer le combat » (`session/:id/combat`, `?reroll=1` pour un nouveau jet en plein combat), sur tout l'écran : elle
 * ajoute les adversaires (dialog existant, réutilisé) puis recueille le jet de réaction de chaque héros avant de démarrer le
 * combat. Un registre, une ligne par héros dont les colonnes s'alignent d'un héros à l'autre : ce qu'il lui faut aux dés et ses
 * chances, la case où taper le total de ses deux dés lancés à table (un bouton les lance à l'écran, sur le plateau de dés partagé),
 * ses dés, son verdict et l'option d'héroïsme qu'il ouvre. À droite, l'ordre d'action se remplit à mesure des jets, et c'est là
 * qu'on coche les adversaires qui jouent. Les modificateurs d'embuscade et d'initiative adverse (02-actions-combat.md) sont communs à
 * toute la rencontre, réglés une fois au-dessus des lignes. Le calcul est dans `reaction-roll.util.ts`.
 */
@Component({
  selector: 'bol-start-combat-page',
  imports: [A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatCheckboxModule, MatIconModule, MatTooltipModule, DiceBoxHostComponent, DwDiceRowComponent],
  templateUrl: './start-combat-page.html',
  styleUrl: './start-combat-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StartCombatPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly data: StartCombatContext = {
    sessionId: this.route.snapshot.paramMap.get('id') ?? '',
    reroll: this.route.snapshot.queryParamMap.get('reroll') === '1',
  };
  private readonly dialog = inject(MatDialog);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly injector = inject(Injector);

  private readonly diceBox = viewChild(DiceBoxHostComponent);
  private readonly totalInputs = viewChildren<ElementRef<HTMLInputElement>>('totalInput');
  private readonly startButton = viewChild('startButton', {read: ElementRef<HTMLButtonElement>});

  protected readonly loading = signal(true);
  protected readonly starting = signal(false);
  protected readonly rolling = signal(false);
  private readonly adversaries = signal<readonly AdversaryRow[]>([]);
  private readonly heroes = signal<readonly HeroRow[]>([]);
  private readonly existingHeroIds = signal<ReadonlySet<string>>(new Set());

  /** Héroïsme courant par héros (clé pivotId) — signal dédié car `applyHeroismeDelta` le mute en place. */
  private readonly heroismeByPivot = new Map<number, WritableSignal<number>>();
  /** Total des deux dés de chaque héros (clé pivotId), saisi ou lancé sur cette page. Non persisté : le back ne stocke que le
   * résultat. */
  /** Les faces des dés de chaque héros lancés à l'écran (clé pivotId), dé de bonus ou de malus compris : elles s'affichent à côté de
   * la case du total. */
  private readonly facesByPivot = signal<ReadonlyMap<number, readonly number[]>>(new Map());
  private readonly diceTotalByPivot = signal<ReadonlyMap<number, number>>(new Map());
  /** Héros (clé pivotId) qui ont converti leur réussite en succès héroïque pour 1 point d'héroïsme. */
  private readonly heroicUpgrades = signal<ReadonlySet<number>>(new Set());
  /** Héros (clé pivotId) dont la faveur divine attend le total des dés relancés à table. */
  private readonly favorPendingPivots = signal<ReadonlySet<number>>(new Set());
  /** Le dé de bonus (1) ou de malus (−1) que le MJ accorde à un héros pour ce jet (règle générale des dés de bonus et de malus). */
  private readonly gmDieByPivot = signal<ReadonlyMap<number, 1 | -1>>(new Map());
  /** La carrière utile que le MJ accorde à chaque héros pour ce jet (clé pivotId → nom de la carrière). */
  private readonly careerByPivot = signal<ReadonlyMap<number, string>>(new Map());

  /** Les enregistrements des jets partent un par un, dans l'ordre : deux changements rapprochés du même héros n'arrivent jamais
   * inversés au serveur, et le combat ne démarre qu'une fois le dernier passé. */
  private saveQueue: Promise<void> = Promise.resolve();

  protected readonly ambushOptions = AMBUSH_OPTIONS;
  /** Fait commun à toute la rencontre, pas par héros. */
  protected readonly ambushState = signal<AmbushState>(null);
  private readonly ambushModifier = computed(() => AMBUSH_OPTIONS.find((option) => option.value === this.ambushState())?.modifier ?? 0);

  /** Portraits qui n'ont pas pu être chargés (un PNJ ou une créature sans image) : l'initiale du combattant les remplace. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());

  /** Cartes (`{kind}-{pivotId}`) exclues de ce combat : elles restent sur la table et reviennent à la fin du combat. */
  private readonly excluded = signal<ReadonlySet<string>>(new Set());

  /** Les héros et adversaires qui participent à ce combat. */
  private readonly activeHeroes = computed(() => this.heroes().filter((h) => !this.isExcluded('hero', h.pivotId)));
  private readonly activeAdversaries = computed(() => this.adversaries().filter((a) => !this.isExcluded(a.kind, a.pivotId)));

  /** « Si un coriace ou un rival possède une valeur d'initiative, prenez la plus haute valeur d'initiative parmi les adversaires des
   * héros, et appliquez-la en malus au jet de réaction des héros » (02-actions-combat.md). Calculée d'après les PNJ présents (seuls
   * ils ont une initiative) ; le MJ peut la corriger à la main. */
  private readonly initiativeAdversaries = computed(() => this.activeAdversaries().filter((a) => !a.ally && (a.rang === 'rival' || a.rang === 'coriace')));
  protected readonly hasInitiativeAdversary = computed(() => this.initiativeAdversaries().length > 0);
  private readonly detectedInitiative = computed(() => Math.max(0, ...this.initiativeAdversaries().map((a) => a.initiative)));
  private readonly initiativeOverride = signal<number | null>(null);
  protected readonly adversaryInitiativeMalus = computed(() => (this.hasInitiativeAdversary() ? (this.initiativeOverride() ?? this.detectedInitiative()) : 0));

  /** Ce que les modificateurs de la rencontre ajoutent au jet de chaque héros. */
  private readonly tableModifier = computed(() => this.ambushModifier() - this.adversaryInitiativeMalus());

  protected readonly heroCards = computed<readonly HeroCard[]>(() =>
    this.heroes().map((hero) => {
      const parts = this.partsFor(hero);
      const modifier = reactionModifier(parts);
      const dice = this.diceTotalFor(hero.pivotId);
      const net = this.diceNetFor(hero);
      const chance = Math.round(actionSuccessChance(net, modifier, REACTION_ROLL_THRESHOLD) * 100);
      const upgraded = this.heroicUpgrades().has(hero.pivotId);
      const optionChosen = hero.resultat === 'echec_critique' || hero.resultat === 'legendaire' || upgraded;
      const heroisme = this.heroismeSignal(hero.pivotId)();
      // Sans point d'héroïsme, ni le succès légendaire ni le succès héroïque ne sont proposés ; une fois choisis ils restent affichés,
      // pour pouvoir y renoncer. Un double 6 qui était le seul moyen de réussir n'est qu'une réussite : il peut, lui, devenir héroïque.
      const base = dice === null ? null : reactionResult(dice, modifier);
      const legendary = dice === 12 && base === 'heroique' && (optionChosen || heroisme > 0);
      const heroic = base === 'reussite' && (upgraded || heroisme > 0);
      return {
        hero,
        avatar: this.usableAvatar(hero.avatar),
        excluded: this.isExcluded('hero', hero.pivotId),
        target: actionDiceTargetLabel(actionDiceTarget(modifier, REACTION_ROLL_THRESHOLD)),
        chance,
        faces: this.facesFor(hero, dice),
        diceCount: 2 + Math.abs(net),
        diceNet: net,
        diceLabel: net === 0 ? null : `${Math.abs(net) > 1 ? '2 dés' : 'dé'} de ${net > 0 ? 'bonus' : 'malus'}`,
        gmDie: this.gmDieByPivot().get(hero.pivotId) ?? null,
        modsCount: (this.gmDieByPivot().has(hero.pivotId) ? 1 : 0) + (parts.carriere ? 1 : 0),
        traitNote: hero.diceNet > 0 ? 'Vigilant : un dé de bonus, toujours.' : hero.diceNet < 0 ? 'Lent à la détente : un dé de malus, toujours.' : null,
        formula: reactionSumTerms(null, parts, net)
          .map((term) =>
            term.tone === 'dice'
              ? `${term.value}${net > 0 ? ' (2 meilleurs)' : net < 0 ? ' (2 moins bons)' : ''}`
              : term.tone === 'total'
                ? term.value
                : `${term.value} ${term.caption}`,
          )
          .join(' ')
          .concat(TRAIT_DIE[Math.sign(hero.diceNet)] ?? ''),
        dice,
        verdict: hero.resultat ? reactionVerdict(hero.resultat, dice) : null,
        sum: reactionSumTerms(dice, parts, net),
        option: dice === 2 ? 'critique' : legendary ? 'legendaire' : heroic ? 'heroique' : null,
        optionChosen,
        career: parts.carriere ?? null,
        favor: hero.resultat === 'echec' && heroisme > 0,
        heroisme,
        gems: Array.from({length: Math.max(5, heroisme)}, (_, index) => index < heroisme),
        favorPending: this.favorPendingPivots().has(hero.pivotId),
      };
    }),
  );

  /** L'ordre d'action tel qu'il se dessine : les héros d'après leur jet, les autres d'après leur rang. */
  protected readonly lanes = computed(() =>
    reactionLanes(
      this.activeHeroes().map((h) => {
        const dice = this.diceTotalFor(h.pivotId);
        return {pivotId: h.pivotId, nom: h.nom, avatar: this.usableAvatar(h.avatar), resultat: h.resultat, total: dice === null ? null : dice + reactionModifier(this.partsFor(h))};
      }),
      this.adversaries().map((a) => ({...a, avatar: this.usableAvatar(a.avatar), excluded: this.isExcluded(a.kind, a.pivotId)})),
    ),
  );

  /** L'ordre d'action en frise, chaque bloc avec son rang dans le round (1, 2…). Les héros qui n'ont pas lancé n'y sont pas : leurs lignes,
   * en face, l'indiquent déjà. */
  protected readonly track = computed(() =>
    this.lanes()
      .filter((lane) => lane.id !== 'attente')
      .map((lane, index) => ({lane, step: index + 1, heroes: lane.id === 'heros' || lane.id === 'echec' || lane.id === 'echec_critique'})),
  );

  /** Les groupes dont on a déplié les exemplaires, pour en cocher un seul. */
  protected readonly unfolded = signal<ReadonlySet<string>>(new Set());

  protected readonly pendingHeroes = computed(() => this.activeHeroes().filter((h) => h.resultat === null));
  /** « 2 / 4 jets » dans l'en-tête. */
  protected readonly rolledCount = computed(() => this.activeHeroes().length - this.pendingHeroes().length);
  protected readonly heroCount = computed(() => this.activeHeroes().length);
  /** Où on en est, au-dessus du titre : la session, puis la scène en cours s'il y en a une. */
  protected readonly where = signal('');
  /** Aucun adversaire (une fois la table chargée) : le combat ne peut pas commencer, ajouter un adversaire devient l'action principale. */
  /** Les adversaires qui comptent pour démarrer : ni exclus, ni du camp des héros (un allié ne suffit pas à faire un combat). */
  private readonly activeEnemies = computed(() => this.activeAdversaries().filter((a) => !a.ally));
  /** Pas d'adversaire pour démarrer. Un nouveau jet de réaction en plein combat n'en demande pas (comme côté serveur). */
  protected readonly noAdversary = computed(() => !this.loading() && !this.data.reroll && this.activeEnemies().length === 0);
  protected readonly canStart = computed(() => !this.noAdversary() && !this.loading() && this.pendingHeroes().length === 0);

  /** La règle du jet et de l'ordre, dans l'infobulle du « i » à côté du titre (02-actions-combat.md, « Jet de réaction »). */
  protected readonly rules =
    'Jet de réaction : 2d6 + esprit + initiative, réussite à 9. Les PNJ, créatures et démons n’ont pas de jet : leur rang les place.\n' +
    'Initiative ennemie : la plus haute des rivaux et coriaces adverses, retranchée à chaque jet.\n' +
    'Égalité entre héros : l’agilité la plus haute agit d’abord, sauf s’ils en décident autrement ; à agilité égale, ils agissent en même temps.';

  constructor() {
    this.reload();

    // Un modificateur change (embuscade, initiative ennemie, carrière accordée) : les jets déjà faits sont recalculés avec leurs dés.
    effect(() => {
      this.tableModifier();
      this.careerByPivot();
      untracked(() => this.rescoreRolledHeroes());
    });
  }

  private partsFor(hero: HeroRow): ReactionParts {
    const label = this.careerByPivot().get(hero.pivotId);
    return {
      esprit: hero.esprit,
      initiative: hero.initiative,
      equipement: hero.initiativeEquipement,
      embuscade: this.ambushModifier(),
      initiativeEnnemie: this.adversaryInitiativeMalus(),
      carriere: hero.carrieres.find((c) => c.label === label) ?? null,
    };
  }

  /** Recalcule le résultat des héros qui ont déjà lancé. Un double 1 ou un double 6 prime sur les modificateurs : leur résultat ne
   * bouge pas. Une réussite convertie en succès héroïque le reste tant qu'elle réussit ; devenue un échec, la conversion tombe et le
   * point d'héroïsme est rendu. */
  private rescoreRolledHeroes(): void {
    for (const hero of this.heroes()) {
      const dice = this.diceTotalFor(hero.pivotId);
      if (dice === null || dice === 2 || dice === 12 || hero.resultat === null) {
        continue;
      }
      const base = reactionResult(dice, reactionModifier(this.partsFor(hero)));
      const upgraded = this.heroicUpgrades().has(hero.pivotId);
      if (upgraded && base !== 'reussite') {
        this.setHeroicUpgrade(hero.pivotId, false);
        applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, this.heroismeSignal(hero.pivotId), 1);
      }
      const resultat = upgraded && base === 'reussite' ? 'heroique' : base;
      if (resultat !== hero.resultat) {
        this.saveResult(hero.pivotId, resultat);
      }
    }
  }

  private reload(): void {
    this.loading.set(true);
    this.fightSessionService
      .fightSession(this.data.sessionId)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          // On n'arrive ici que depuis la table, mais un lien direct ou un onglet resté ouvert peut tomber sur une session où ce jet n'a
          // plus de sens : en combat sans être un nouveau jet, ou terminée. Retour à la table.
          if (session.statut !== 'libre' && !(this.data.reroll && session.statut === 'combat')) {
            this.close();
            return;
          }
          this.where.set([session.titre, session.scene?.titre].filter((part): part is string => !!part).join(' · '));
          // Mêmes portraits que sur la table (`combat-play.util.ts`) : celui de la fiche, sinon l'image du catalogue.
          this.adversaries.set([
            ...(session.pnjs ?? []).map((p) => ({pivotId: p.id, kind: 'pnj' as const, nom: p.surnom ?? p.nom, avatar: pnjAvatar(p), sourceId: p.pnj_id, rang: p.rang, initiative: p.initiative ?? 0, ally: p.camp === 'heros'})),
            ...(session.creatures ?? []).map((c) => ({pivotId: c.id, kind: 'creature' as const, nom: c.surnom ?? c.nom, avatar: c.creature?.avatar || (c.creature_id ? `/assets/bol/bestiary/${c.creature_id}.jpg` : null), sourceId: c.creature_id, rang: c.rang, initiative: 0, ally: c.camp === 'heros'})),
            ...(session.demons ?? []).map((d) => ({pivotId: d.id, kind: 'demon' as const, nom: d.surnom ?? d.nom, avatar: d.demon?.avatar || (d.demon_id ? `/assets/bol/demon/${d.demon_id}.jpg` : null), sourceId: d.demon_id, rang: d.rang, initiative: 0, ally: d.camp === 'heros'})),
          ]);
          this.existingHeroIds.set(new Set((session.heros ?? []).map((h) => String(h.heros_id))));

          const heroEntries = session.heros ?? [];
          if (heroEntries.length === 0) {
            this.heroes.set([]);
            this.loading.set(false);
            return;
          }

          forkJoin(heroEntries.map((h) => this.herosService.heros(h.heros_id).pipe(take(1)))).subscribe({
            next: (fullHeroes) => {
              // Un nouveau combat réclame un nouveau jet de réaction (02-actions-combat.md) : seuls comptent les jets faits sur cette
              // page. Un résultat resté en base d'un combat précédent ou d'une page quittée n'est pas repris, et il est effacé.
              const rolledHere = new Map(this.heroes().map((h) => [h.pivotId, h.resultat]));
              const rows = heroEntries.map((h, i): HeroRow => {
                const hero = fullHeroes[i];
                const details = heroDetails(hero);
                this.heroismeSignal(h.id).set(hero.ressources.heroisme);
                return {
                  pivotId: h.id,
                  herosId: h.heros_id,
                  nom: hero.origines.nom ?? 'Héros',
                  avatar: hero.origines.avatar,
                  resultat: rolledHere.get(h.id) ?? null,
                  esprit: hero.attributs.esprit,
                  initiative: hero.combat.initiative_effective,
                  initiativeEquipement: hero.combat.initiative_effective - hero.combat.initiative,
                  carrieres: details.carrieres.filter((c) => c.value > 0),
                  diceNet: reactionDiceNet(details.traits),
                  agilite: hero.attributs.agilite,
                  fiche: hero,
                };
              });
              // Par agilité décroissante : entre héros de même résultat, c'est l'ordre dans lequel ils agiront par défaut
              // (02-actions-combat.md). À agilité égale, l'ordre de la table est gardé.
              this.heroes.set(rows.sort((a, b) => b.agilite - a.agilite));
              for (const h of heroEntries) {
                if (h.initiative_resultat !== null && !rolledHere.get(h.id)) {
                  this.enqueueSave(h.id, null, "Impossible d'effacer un jet de réaction précédent.");
                }
              }
              this.loading.set(false);
              this.focusTotalOf(this.pendingHeroes()[0]);
            },
            error: (error: unknown) => {
              this.loading.set(false);
              this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger les héros.'), 'Fermer', {
                duration: 5000,
              });
            },
          });
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger la session.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
  }

  /** Les faces à montrer d'un héros : celles lancées à l'écran, les deux dés gardés d'abord puis le dé écarté, marqué (d'une ligne à
   * l'autre, les dés qui comptent tombent ainsi à la même place) ; sinon celles qu'un total tapé suffit à connaître (2 : double 1,
   * 12 : double 6) ; sinon aucune. */
  private facesFor(hero: HeroRow, dice: number | null): readonly DiceRowDie[] | null {
    const rolled = this.facesByPivot().get(hero.pivotId);
    if (rolled) {
      const kept = keptDiceIndexes(rolled, this.diceNetFor(hero));
      const faces = rolled.map((value, index) => ({value, dropped: !kept.includes(index)}));
      return [...faces.filter((face) => !face.dropped), ...faces.filter((face) => face.dropped)];
    }
    return dice === 2 ? [{value: 1}, {value: 1}] : dice === 12 ? [{value: 6}, {value: 6}] : null;
  }

  /** Ouvre le statbloc d'un héros par-dessus la page. */
  protected openSheet(hero: HeroRow): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {data: heroStatblockData(hero.fiche), imageSrc: hero.avatar ?? '', kind: 'hero'});
  }

  /** Héroïsme courant d'un héros — signal dédié (créé à la demande) car `applyHeroismeDelta` le mute en place. */
  private heroismeSignal(pivotId: number): WritableSignal<number> {
    let sig = this.heroismeByPivot.get(pivotId);
    if (!sig) {
      sig = signal(0);
      this.heroismeByPivot.set(pivotId, sig);
    }
    return sig;
  }

  private diceTotalFor(pivotId: number): number | null {
    return this.diceTotalByPivot().get(pivotId) ?? null;
  }

  protected isExcluded(kind: InitiativeKind, pivotId: number): boolean {
    return this.excluded().has(`${kind}-${pivotId}`);
  }

  /** Exclut un héros ou un adversaire de ce combat — ou le réintègre. Rien n'est retiré de la table. */
  protected toggleExcluded(kind: InitiativeKind, pivotId: number): void {
    const key = `${kind}-${pivotId}`;
    this.excluded.update((set) => {
      const next = new Set(set);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  /** La case d'un groupe : cochée (tous jouent), elle les exclut tous ; sinon, en partie ou pas du tout, tous reviennent. */
  protected toggleGroupExcluded(group: ReactionGroup): void {
    const exclude = group.tokens.every((token) => !token.excluded);
    this.excluded.update((set) => {
      const next = new Set(set);
      for (const token of group.tokens) {
        const key = `${token.kind}-${token.pivotId}`;
        if (exclude) {
          next.add(key);
        } else {
          next.delete(key);
        }
      }
      return next;
    });
  }

  protected toggleUnfolded(key: string): void {
    this.unfolded.update((set) => {
      const next = new Set(set);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  /** Combien d'exemplaires d'un groupe jouent ce combat. */
  protected groupIncluded(group: ReactionGroup): number {
    return group.tokens.filter((token) => !token.excluded).length;
  }

  protected onAvatarError(avatar: string): void {
    this.brokenAvatars.update((set) => new Set(set).add(avatar));
  }

  private usableAvatar(avatar: string | null): string | null {
    return avatar && !this.brokenAvatars().has(avatar) ? avatar : null;
  }

  protected initial(nom: string): string {
    return nom.trim().charAt(0).toUpperCase();
  }

  protected totalInputId(pivotId: number): string {
    return `scd-total-${pivotId}`;
  }

  protected setAmbush(state: AmbushState): void {
    this.ambushState.set(state);
  }

  /** Corrige à la main l'initiative ennemie ; revenue à la valeur détectée, elle suit de nouveau les adversaires présents. */
  protected stepAdversaryMalus(delta: number): void {
    const value = Math.max(0, this.adversaryInitiativeMalus() + delta);
    this.initiativeOverride.set(value === this.detectedInitiative() ? null : value);
  }

  protected openAddAdversary(): void {
    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {
          sessionId: this.data.sessionId,
          existingHeroIds: this.existingHeroIds(),
        },
      })
      .afterClosed()
      .subscribe(() => this.reload());
  }

  /** Saisie du total des deux dés lancés à table (pas le résultat avec ses bonus). De 2 à 9 un chiffre suffit : le jet est pris tout
   * de suite et la saisie passe au héros suivant. Une case vidée efface le jet. */
  protected onTotalInput(hero: HeroRow, raw: string): void {
    if (raw.trim() === '') {
      if (this.diceTotalFor(hero.pivotId) !== null) {
        this.setRoll(hero.pivotId, null);
      }
      return;
    }
    const total = parseDiceTotal(raw);
    if (total === null) {
      return;
    }
    this.setRoll(hero.pivotId, total);
    const heroes = this.activeHeroes();
    const index = heroes.findIndex((h) => h.pivotId === hero.pivotId);
    this.focusTotalOf([...heroes.slice(index + 1), ...heroes.slice(0, index)].find((h) => h.resultat === null));
  }

  /** En quittant la case, une saisie laissée incomplète ou hors de 2-12 cède la place au total retenu. */
  protected restoreTotal(input: HTMLInputElement, dice: number | null): void {
    input.value = dice === null ? '' : `${dice}`;
  }

  /** Donne la main à la case d'un héros — ou, s'il ne reste personne, au bouton qui démarre le combat. Après le rendu : le bouton
   * n'est actif qu'une fois le dernier jet affiché. */
  private focusTotalOf(hero: HeroRow | undefined): void {
    afterNextRender(
      () => {
        const id = hero ? this.totalInputId(hero.pivotId) : null;
        const target = id ? this.totalInputs().find((input) => input.nativeElement.id === id) : this.startButton();
        target?.nativeElement.focus();
      },
      {injector: this.injector},
    );
  }

  /** Lance 2d6 à l'écran pour un héros, sur le plateau de dés partagé. */
  protected async rollFor(hero: HeroRow): Promise<void> {
    const box = this.diceBox();
    if (!box || this.rolling()) {
      return;
    }

    this.rolling.set(true);
    try {
      await box.clear();
      // Avec un dé de bonus ou de malus, il lance un dé de plus et garde les deux meilleurs ou les deux moins bons.
      const net = this.diceNetFor(hero);
      const results = await box.rollNotation(`${2 + Math.abs(net)}d6`);
      const values = results.map((result) => result.value);
      const [first, second] = keptDiceIndexes(values, net);
      this.setRoll(hero.pivotId, values[first] + values[second]);
      this.facesByPivot.update((map) => new Map(map).set(hero.pivotId, values));
    } finally {
      this.rolling.set(false);
    }
  }

  /** Lance le jet de chaque héros qui n'en a pas encore, l'un après l'autre (un seul plateau de dés). */
  protected async rollAll(): Promise<void> {
    for (const hero of this.pendingHeroes()) {
      await this.rollFor(hero);
    }
  }

  /** Dégage les dés 3D encore posés sur la page (les jets ne sont pas touchés). Ignoré pendant un lancer : ce clear() entrerait
   * en course avec celui du lancer et corromprait l'état de la librairie de dés. */
  protected dismissDice(): void {
    if (!this.rolling()) {
      void this.diceBox()?.clear();
    }
  }

  /** Les dés de bonus (positif) ou de malus (négatif) du jet d'un héros : ceux de son trait, plus celui du MJ ; deux au plus. */
  private diceNetFor(hero: HeroRow): number {
    return Math.max(-2, Math.min(2, hero.diceNet + (this.gmDieByPivot().get(hero.pivotId) ?? 0)));
  }

  /** Le MJ accorde à un héros un dé de bonus (1) ou de malus (−1) pour ce jet, ou le retire (`null`). Le total déjà tapé reste ; les
   * faces d'un lancer à l'écran, qui ne comptaient pas ce dé, s'effacent. */
  protected setGmDie(hero: HeroRow, die: 1 | -1 | null): void {
    this.gmDieByPivot.update((map) => {
      const next = new Map(map);
      if (die === null) {
        next.delete(hero.pivotId);
      } else {
        next.set(hero.pivotId, die);
      }
      return next;
    });
    this.facesByPivot.update((map) => {
      const next = new Map(map);
      next.delete(hero.pivotId);
      return next;
    });
  }

  /** Le popover des modificateurs ouvert (clé pivotId du héros), `null` sinon : un seul à la fois. */
  protected readonly modsOpen = signal<number | null>(null);
  protected readonly popoverPositions: ConnectedPosition[] = [
    {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6},
    {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6},
  ];

  protected toggleMods(pivotId: number): void {
    this.modsOpen.update((open) => (open === pivotId ? null : pivotId));
  }

  /** Ferme le popover des modificateurs et rend le focus à son bouton. */
  protected closeMods(): void {
    const pivotId = this.modsOpen();
    this.modsOpen.set(null);
    if (pivotId !== null) {
      document.getElementById(`scd-mods-${pivotId}`)?.focus();
    }
  }

  protected onModsKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMods();
    }
  }

  /** Le MJ accorde à un héros le rang d'une de ses carrières pour ce jet, ou le retire (`null`). */
  protected setCareer(hero: HeroRow, label: string | null): void {
    this.careerByPivot.update((map) => {
      const next = new Map(map);
      if (label === null) {
        next.delete(hero.pivotId);
      } else {
        next.set(hero.pivotId, label);
      }
      return next;
    });
  }

  /** Coche ou décoche l'option d'héroïsme d'un double 1 (échec critique : +1 point), d'un double 6 (succès légendaire : −1) ou d'une
   * réussite (succès héroïque : −1). */
  protected toggleOption(card: HeroCard): void {
    const {hero, dice, option} = card;
    if (dice === null || option === null) {
      return;
    }
    const chosen = !card.optionChosen;
    const heroisme = this.heroismeSignal(hero.pivotId);
    if (option !== 'critique' && chosen && heroisme() <= 0) {
      return;
    }
    if (option === 'heroique') {
      const before = hero.resultat;
      this.setHeroicUpgrade(hero.pivotId, chosen);
      // L'héroïsme n'a pas pu être mis à jour : le choix est défait.
      applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, heroisme, chosen ? -1 : 1, () => {
        this.setHeroicUpgrade(hero.pivotId, !chosen);
        this.saveResult(hero.pivotId, before);
      });
      this.saveResult(hero.pivotId, chosen ? 'heroique' : 'reussite');
      return;
    }
    const gain = option === 'critique' ? 1 : -1;
    const before = hero.resultat;
    // L'héroïsme n'a pas pu être mis à jour : le choix est défait.
    applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, heroisme, chosen ? gain : -gain, () => this.saveResult(hero.pivotId, before));
    this.saveResult(hero.pivotId, reactionResult(dice, reactionModifier(this.partsFor(hero)), chosen));
  }

  /** Faveur divine (02-actions-combat.md) : 1 point d'héroïsme pour relancer les deux dés d'un jet raté, même un double 1 ; le second
   * jet est gardé. Le jet s'efface et la case attend le second : le joueur relance à table et tape le total, ou lance à l'écran — même
   * si le premier jet avait été lancé à l'écran, c'est à lui de choisir. */
  protected divineFavor(card: HeroCard): void {
    const {hero} = card;
    const heroisme = this.heroismeSignal(hero.pivotId);
    if (!card.favor || this.rolling() || heroisme() <= 0) {
      return;
    }
    applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, heroisme, -1);
    this.setRoll(hero.pivotId, null);
    this.favorPendingPivots.update((pivots) => new Set(pivots).add(hero.pivotId));
    this.focusTotalOf(hero);
  }

  /** Retient le jet d'un héros — le total de ses deux dés, ou `null` pour l'effacer — et le résultat qui en découle. Le choix
   * d'héroïsme du jet précédent tombe avec lui. */
  private setRoll(pivotId: number, dice: number | null): void {
    const hero = this.heroes().find((h) => h.pivotId === pivotId);
    if (!hero) {
      return;
    }
    this.undoHeroismeChoice(hero);
    this.setDiceTotal(pivotId, dice);
    this.saveResult(pivotId, dice === null ? null : reactionResult(dice, reactionModifier(this.partsFor(hero))));
  }

  private setDiceTotal(pivotId: number, dice: number | null): void {
    // Un nouveau total (tapé, ou lancé : les faces suivent alors) efface les faces du jet précédent.
    this.facesByPivot.update((map) => {
      const next = new Map(map);
      next.delete(pivotId);
      return next;
    });
    this.diceTotalByPivot.update((map) => {
      const next = new Map(map);
      if (dice === null) {
        next.delete(pivotId);
      } else {
        next.set(pivotId, dice);
      }
      return next;
    });
    // Le second jet d'une faveur divine est arrivé.
    if (dice !== null && this.favorPendingPivots().has(pivotId)) {
      this.favorPendingPivots.update((pivots) => {
        const next = new Set(pivots);
        next.delete(pivotId);
        return next;
      });
    }
  }

  /** Reprend ou rend le point d'héroïsme du choix porté par le résultat d'un héros : l'échec critique lui en avait rapporté 1, le
   * succès légendaire ou la réussite convertie en succès héroïque lui en avaient coûté 1. */
  private undoHeroismeChoice(hero: HeroRow): void {
    const upgraded = this.heroicUpgrades().has(hero.pivotId);
    this.setHeroicUpgrade(hero.pivotId, false);
    const delta = hero.resultat === 'echec_critique' ? -1 : hero.resultat === 'legendaire' || upgraded ? 1 : 0;
    if (delta !== 0) {
      applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, this.heroismeSignal(hero.pivotId), delta);
    }
  }

  private setHeroicUpgrade(pivotId: number, upgraded: boolean): void {
    this.heroicUpgrades.update((pivots) => {
      const next = new Set(pivots);
      if (upgraded) {
        next.add(pivotId);
      } else {
        next.delete(pivotId);
      }
      return next;
    });
  }

  /** Affiche tout de suite le résultat d'un héros, puis l'envoie au serveur. Si l'envoi échoue, le jet est à refaire : la carte
   * revient en attente et son éventuel choix d'héroïsme est annulé. */
  private saveResult(pivotId: number, resultat: InitiativeResultat | null): void {
    this.heroes.update((list) => list.map((h) => (h.pivotId === pivotId ? {...h, resultat} : h)));
    this.enqueueSave(pivotId, resultat, "Impossible d'enregistrer ce jet de réaction.", () => {
      const hero = this.heroes().find((h) => h.pivotId === pivotId);
      // Un autre jet a pu être saisi entre-temps : celui-là suit son propre enregistrement.
      if (!hero || resultat === null || hero.resultat !== resultat) {
        return;
      }
      this.undoHeroismeChoice(hero);
      this.setDiceTotal(pivotId, null);
      this.heroes.update((list) => list.map((h) => (h.pivotId === pivotId ? {...h, resultat: null} : h)));
    });
  }

  private enqueueSave(pivotId: number, resultat: InitiativeResultat | null, errorMessage: string, onError?: () => void): void {
    this.saveQueue = this.saveQueue
      .then(() => firstValueFrom(this.fightSessionService.updateHeroInitiative(this.data.sessionId, pivotId, resultat)))
      .then(
        () => undefined,
        (error: unknown) => {
          onError?.();
          this.snackBar.open(extractApiErrorMessage(error, errorMessage), 'Fermer', {duration: 5000});
        },
      );
  }

  protected async start(): Promise<void> {
    this.starting.set(true);
    // Les derniers jets finissent de s'enregistrer avant que le serveur ne construise l'ordre d'action.
    await this.saveQueue;
    if (!this.canStart()) {
      this.starting.set(false);
      return;
    }
    this.fightSessionService
      .startCombat(this.data.sessionId, [...this.excluded()])
      .pipe(switchMap((session) => this.markSurprised(session)))
      .subscribe({
        next: () => {
          this.starting.set(false);
          this.close();
        },
        error: (error: unknown) => {
          this.starting.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de démarrer le combat.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
  }

  /** Héros surpris au premier round : le camp des héros ne bénéficie pas de son bouclier (effet « surpris », jusqu'à la fin du round). Rien
   * à enregistrer sinon, ni pour un nouveau jet de réaction en cours de combat. */
  private markSurprised(session: BolFightSessionModel): Observable<unknown> {
    const etat = session.etat_combat;
    if (this.ambushState() !== 'heroes_ambushed' || !etat || etat.round !== 1) {
      return of(null);
    }
    const porteurs = [
      ...this.activeHeroes().map((hero) => `hero-${hero.pivotId}`),
      ...this.activeAdversaries()
        .filter((adversary) => adversary.ally)
        .map((ally) => `${ally.kind}-${ally.pivotId}`),
    ];
    const effets = porteurs.reduce<readonly CombatEffect[]>((liste, porteur) => appliquerEvenement(liste, {type: 'ajout-manuel', effet: effetSurpris(porteur)}, idAleatoire), []);
    return this.fightSessionService.updateCombatState(this.data.sessionId, {round: etat.round, joues: [], effets: [...effets], exclus: [...(etat.exclus ?? [])]});
  }

  /** Retour à la table, qui recharge la session en arrivant. */
  protected close(): void {
    void this.router.navigate(['/session', this.data.sessionId, 'play']);
  }
}
