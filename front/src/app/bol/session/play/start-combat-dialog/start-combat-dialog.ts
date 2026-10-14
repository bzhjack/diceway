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
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {firstValueFrom, forkJoin, Observable, of, switchMap, take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {BolFightSessionModel, InitiativeResultat} from '../../../models/bol-fight-session.model';
import {AmbushState} from '../../../models/combat-selection.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {actionDiceTarget, actionDiceTargetLabel, actionSuccessChance, chanceRingDash, parseDiceTotal} from '../../action-roll.util';
import {applyHeroismeDelta} from '../../heroisme-spend.util';
import {ActionDiceTargetLabel, RollSumTerm} from '../../models/action-roll.model';
import {CombatEffect} from '../../models/combat-effect.model';
import {InitiativeKind} from '../../models/initiative.model';
import {appliquerEvenement, effetSurpris, idAleatoire} from '../tapis/combat-effects.util';
import {ReactionAdversary, ReactionParts, ReactionToken, ReactionVerdict, StartCombatDialogData} from '../../models/start-combat-dialog.model';
import {REACTION_ROLL_THRESHOLD, reactionLanes, reactionModifier, reactionResult, reactionSumTerms, reactionVerdict} from '../../reaction-roll.util';
import {AddCombatantDialogComponent} from '../add-combatant-dialog/add-combatant-dialog';

/** Un PNJ, une créature ou un démon tel que le dialogue le charge : ce que l'ordre d'action en montre, plus son initiative. */
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
  readonly initiative: number;
  /** Agilité du héros, sans le malus de son armure : elle n'entre pas dans le jet, elle départage les héros de même résultat. */
  readonly agilite: number;
}

/** La carte d'un héros, prête à afficher : ce qu'il lui faut aux dés, ses chances, son jet et son verdict. */
interface HeroCard {
  readonly hero: HeroRow;
  /** Son portrait, `null` s'il n'en a pas : son initiale le remplace. */
  readonly avatar: string | null;
  readonly excluded: boolean;
  readonly target: ActionDiceTargetLabel;
  readonly chance: number;
  readonly ringDash: string;
  /** Total de ses deux dés, `null` avant son jet. */
  readonly dice: number | null;
  readonly verdict: ReactionVerdict | null;
  readonly sum: readonly RollSumTerm[];
  /** Option d'héroïsme ouverte par son jet : l'échec critique sur un double 1 (+1 point), le succès légendaire sur un double 6 (−1). */
  readonly option: 'critique' | 'legendaire' | null;
  readonly optionChosen: boolean;
}

/** Embuscade (02-actions-combat.md, « Modificateurs au jet de réaction ») : la tendre ou surprendre l'ennemi donne +2 (Très facile),
 * être surpris ou pris en embuscade donne −1 (Ardue). */
const AMBUSH_OPTIONS: readonly {readonly value: AmbushState; readonly label: string; readonly bonus: string; readonly modifier: number}[] = [
  {value: null, label: 'Aucune', bonus: '', modifier: 0},
  {value: 'heroes_ambush', label: 'Tendue par les héros', bonus: '+2', modifier: 2},
  {value: 'heroes_ambushed', label: 'Héros surpris', bonus: '−1', modifier: -1},
];

/** Largeur du dialogue jusqu'à quatre héros, et ce qu'ajoute chaque héros au-delà : cinq ou six cartes tiennent ainsi sur une rangée,
 * sans défilement. L'écran borne le tout (`maxWidth` du dialogue). */
const BASE_WIDTH_PX = 1240;
const CARD_WIDTH_PX = 262;
const MAX_CARDS_PER_ROW = 6;

/**
 * Ajoute les adversaires (dialog existant, réutilisé) puis recueille le jet de réaction de chaque héros avant de démarrer le
 * combat. Chaque héros a sa carte, dans le langage de sa fiche : ce qu'il lui faut aux dés, ses chances, la case où taper le total
 * de ses deux dés lancés à table (un bouton les lance à l'écran, sur le plateau de dés partagé), puis son verdict et ce qu'il change
 * au combat. Le double 1 et le double 6 se décident sur la carte. Dessous, l'ordre d'action se remplit à mesure des jets. Les
 * modificateurs d'embuscade et d'initiative adverse (02-actions-combat.md) sont communs à toute la rencontre, réglés une fois
 * au-dessus des cartes. Le calcul est dans `reaction-roll.util.ts`.
 */
@Component({
  selector: 'bol-start-combat-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTooltipModule, DiceBoxHostComponent],
  templateUrl: './start-combat-dialog.html',
  styleUrl: './start-combat-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class StartCombatDialogComponent {
  protected readonly ref = inject(MatDialogRef<StartCombatDialogComponent, boolean>);
  protected readonly data = inject<StartCombatDialogData>(MAT_DIALOG_DATA);
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
  /** Total des deux dés de chaque héros (clé pivotId), saisi ou lancé dans ce dialogue. Non persisté : le back ne stocke que le
   * résultat. */
  private readonly diceTotalByPivot = signal<ReadonlyMap<number, number>>(new Map());

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
      const chance = Math.round(actionSuccessChance(0, modifier, REACTION_ROLL_THRESHOLD) * 100);
      const optionChosen = hero.resultat === 'echec_critique' || hero.resultat === 'legendaire';
      // Sans point d'héroïsme, le succès légendaire n'est pas proposé ; une fois choisi il reste affiché, pour pouvoir y renoncer.
      // Un double 6 qui était le seul moyen de réussir n'est qu'une réussite : pas de succès légendaire à acheter.
      const legendary = dice === 12 && reactionResult(12, modifier) === 'heroique' && (optionChosen || this.heroismeSignal(hero.pivotId)() > 0);
      return {
        hero,
        avatar: this.usableAvatar(hero.avatar),
        excluded: this.isExcluded('hero', hero.pivotId),
        target: actionDiceTargetLabel(actionDiceTarget(modifier, REACTION_ROLL_THRESHOLD)),
        chance,
        ringDash: chanceRingDash(chance),
        dice,
        verdict: hero.resultat ? reactionVerdict(hero.resultat, dice) : null,
        sum: reactionSumTerms(dice, parts),
        option: dice === 2 ? 'critique' : legendary ? 'legendaire' : null,
        optionChosen,
      };
    }),
  );

  /** Un héros en jeu a obtenu un double 1 ou un double 6 : chaque carte garde alors une place pour l'option d'héroïsme. */
  protected readonly anyOption = computed(() => this.heroCards().some((card) => !card.excluded && card.option !== null));

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

  protected readonly pendingHeroes = computed(() => this.activeHeroes().filter((h) => h.resultat === null));
  protected readonly canStart = computed(() => this.activeAdversaries().length > 0 && this.pendingHeroes().length === 0);

  /** Ce que la table doit savoir avant de commencer : ce qui manque, puis les égalités entre héros. L'ordre des cartes est déjà celui
   * du livre pour les départager : par agilité décroissante. */
  protected readonly note = computed(() => {
    if (this.activeAdversaries().length === 0) {
      return 'Aucun adversaire : ajoutes-en un pour pouvoir démarrer.';
    }
    const missing = this.pendingHeroes().length;
    if (missing > 0) {
      return missing === 1 ? 'Il manque 1 jet.' : `Il manque ${missing} jets.`;
    }
    const heroes = this.activeHeroes();
    const tied = heroes.filter((h) => heroes.some((other) => other !== h && other.resultat === h.resultat));
    if (tied.length === 0) {
      return '';
    }
    const sameAgility = tied.some((h) => tied.some((other) => other !== h && other.resultat === h.resultat && other.agilite === h.agilite));
    return `Égalité entre héros : l'agilité la plus haute agit d'abord, sauf s'ils en décident autrement${sameAgility ? ' ; à agilité égale, ils agissent en même temps' : ''}.`;
  });

  constructor() {
    this.reload();

    // Un modificateur de la rencontre (embuscade, initiative ennemie) change : les jets déjà faits sont recalculés avec leurs dés.
    effect(() => {
      this.tableModifier();
      untracked(() => this.rescoreRolledHeroes());
    });
  }

  private partsFor(hero: HeroRow): ReactionParts {
    return {esprit: hero.esprit, initiative: hero.initiative, embuscade: this.ambushModifier(), initiativeEnnemie: this.adversaryInitiativeMalus()};
  }

  /** Recalcule le résultat des héros qui ont déjà lancé. Un double 1 ou un double 6 prime sur les modificateurs : leur résultat ne
   * bouge pas. */
  private rescoreRolledHeroes(): void {
    for (const hero of this.heroes()) {
      const dice = this.diceTotalFor(hero.pivotId);
      if (dice === null || dice === 2 || dice === 12 || hero.resultat === null) {
        continue;
      }
      const resultat = reactionResult(dice, reactionModifier(this.partsFor(hero)));
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
          // Mêmes portraits que sur la table (`combat-play.util.ts`) : celui de la fiche, sinon l'image du catalogue.
          this.adversaries.set([
            ...(session.pnjs ?? []).map((p) => ({pivotId: p.id, kind: 'pnj' as const, nom: p.surnom ?? p.nom, avatar: p.pnj?.origines.avatar || (p.pnj_id ? `/assets/bol/pnj/${p.pnj_id}.jpg` : null), rang: p.rang, initiative: p.initiative ?? 0, ally: p.camp === 'heros'})),
            ...(session.creatures ?? []).map((c) => ({pivotId: c.id, kind: 'creature' as const, nom: c.surnom ?? c.nom, avatar: c.creature?.avatar || (c.creature_id ? `/assets/bol/bestiary/${c.creature_id}.jpg` : null), rang: c.rang, initiative: 0, ally: c.camp === 'heros'})),
            ...(session.demons ?? []).map((d) => ({pivotId: d.id, kind: 'demon' as const, nom: d.surnom ?? d.nom, avatar: d.demon?.avatar || (d.demon_id ? `/assets/bol/demon/${d.demon_id}.jpg` : null), rang: d.rang, initiative: 0, ally: d.camp === 'heros'})),
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
              // Un nouveau combat réclame un nouveau jet de réaction (02-actions-combat.md) : seuls comptent les jets faits dans ce
              // dialogue. Un résultat resté en base d'un combat précédent ou d'un dialogue annulé n'est pas repris, et il est effacé.
              const rolledHere = new Map(this.heroes().map((h) => [h.pivotId, h.resultat]));
              const rows = heroEntries.map((h, i): HeroRow => {
                const hero = fullHeroes[i];
                this.heroismeSignal(h.id).set(hero.ressources.heroisme);
                return {
                  pivotId: h.id,
                  herosId: h.heros_id,
                  nom: hero.origines.nom ?? 'Héros',
                  avatar: hero.origines.avatar,
                  resultat: rolledHere.get(h.id) ?? null,
                  esprit: hero.attributs.esprit,
                  initiative: hero.combat.initiative_effective,
                  agilite: hero.attributs.agilite,
                };
              });
              // Par agilité décroissante : entre héros de même résultat, c'est l'ordre dans lequel ils agiront par défaut
              // (02-actions-combat.md). À agilité égale, l'ordre de la table est gardé.
              this.heroes.set(rows.sort((a, b) => b.agilite - a.agilite));
              this.fitWidth(heroEntries.length);
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

  /** Élargit le dialogue au-delà de quatre héros, pour garder leurs cartes sur une seule rangée. */
  private fitWidth(heroCount: number): void {
    const width = Math.max(BASE_WIDTH_PX, 40 + Math.min(heroCount, MAX_CARDS_PER_ROW) * CARD_WIDTH_PX);
    this.ref.updateSize(`min(${width}px, 96vw)`);
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

  protected onAvatarError(avatar: string): void {
    this.brokenAvatars.update((set) => new Set(set).add(avatar));
  }

  private usableAvatar(avatar: string | null): string | null {
    return avatar && !this.brokenAvatars().has(avatar) ? avatar : null;
  }

  protected signed(value: number): string {
    return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0';
  }

  protected initial(nom: string): string {
    return nom.trim().charAt(0).toUpperCase();
  }

  /** L'infobulle d'un jeton de l'ordre d'action : son nom, puis son détail (« total 14 · légendaire », « allié »). */
  protected tokenInfo(token: ReactionToken): string {
    return token.detail ? `${token.nom} · ${token.detail}` : token.nom;
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
      const results = await box.rollNotation('2d6');
      this.setRoll(hero.pivotId, results[0].value + results[1].value);
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

  /** Dégage les dés 3D encore posés sur le dialogue (les jets ne sont pas touchés). Ignoré pendant un lancer : ce clear() entrerait
   * en course avec celui du lancer et corromprait l'état de la librairie de dés. */
  protected dismissDice(): void {
    if (!this.rolling()) {
      void this.diceBox()?.clear();
    }
  }

  /** Coche ou décoche l'option d'héroïsme d'un double 1 (échec critique : +1 point) ou d'un double 6 (succès légendaire : −1). */
  protected toggleOption(card: HeroCard): void {
    const {hero, dice, option} = card;
    if (dice === null || option === null) {
      return;
    }
    const chosen = !card.optionChosen;
    const heroisme = this.heroismeSignal(hero.pivotId);
    if (option === 'legendaire' && chosen && heroisme() <= 0) {
      return;
    }
    const gain = option === 'critique' ? 1 : -1;
    const before = hero.resultat;
    // L'héroïsme n'a pas pu être mis à jour : le choix est défait.
    applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, heroisme, chosen ? gain : -gain, () => this.saveResult(hero.pivotId, before));
    this.saveResult(hero.pivotId, reactionResult(dice, reactionModifier(this.partsFor(hero)), chosen));
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
    this.diceTotalByPivot.update((map) => {
      const next = new Map(map);
      if (dice === null) {
        next.delete(pivotId);
      } else {
        next.set(pivotId, dice);
      }
      return next;
    });
  }

  /** Reprend ou rend le point d'héroïsme du choix porté par le résultat d'un héros : l'échec critique lui en avait rapporté 1, le
   * succès légendaire lui en avait coûté 1. */
  private undoHeroismeChoice(hero: HeroRow): void {
    const delta = hero.resultat === 'echec_critique' ? -1 : hero.resultat === 'legendaire' ? 1 : 0;
    if (delta !== 0) {
      applyHeroismeDelta(this.herosService, this.snackBar, hero.herosId, this.heroismeSignal(hero.pivotId), delta);
    }
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
          this.ref.close(true);
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

  protected close(): void {
    this.ref.close(undefined);
  }
}
