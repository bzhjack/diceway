import {CdkDrag, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {map, Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {usableAvatar} from '../../../../shared/avatar-fallback/avatar.util';
import {DwGemmesComponent} from '../../../../shared/gemmes/gemmes';
import {AmbianceOption} from '../../models/theatre.model';
import {CombatantAttitude, CombatCamp} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {heroismeGems} from '../../heroisme-spend.util';
import {TableChange} from '../../models/table-change.model';
import {TapisCard} from '../../models/tapis.model';
import {ReservePlacementService} from '../../reserve-placement.service';
import {StageDragDirective} from '../reserve/stage-drag.directive';
import {isLowVitalite, vitalitePercent, vitaliteText} from '../tapis/tapis.util';
import {ATTITUDES, compagnie, troupe} from './theatre.util';

/** Une ligne de la feuille, avec ses valeurs déjà calculées. */
interface Ligne {
  readonly card: TapisCard;
  readonly avatar: string | null;
  readonly percent: number;
  readonly low: boolean;
  readonly tombe: boolean;
  readonly vitalite: string;
  readonly atMax: boolean;
  readonly attitude: AmbianceOption<CombatantAttitude> | null;
  readonly heroisme: number;
  readonly gems: readonly boolean[];
  readonly melee: string;
  readonly tir: string;
  readonly initiative: string;
}

const AUCUNE = '—';

/** Une caractéristique de combat telle qu'elle s'écrit sur la feuille : « 2 », « −1 », ou un tiret quand le personnage n'en a pas. */
function stat(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) {
    return AUCUNE;
  }
  return valeur < 0 ? `−${Math.abs(valeur)}` : String(valeur);
}

/** La vitalité totale d'un groupe de lignes : « 29/31 ». */
function totalVitalite(cards: readonly TapisCard[]): string {
  const courante = cards.reduce((n, c) => n + Math.max(0, c.vitaliteCourante ?? 0), 0);
  const max = cards.reduce((n, c) => n + (c.vitaliteMax ?? 0), 0);
  return `${courante}/${max}`;
}

/**
 * La feuille de situation de la table, hors combat : chaque personnage sur sa ligne, de quoi juger d'un coup d'œil. En haut, ceux d'en
 * face (rangés comme sur la rampe, par rang), puis la compagnie : ses héros, puis ses alliés. Sur chaque ligne : un portrait carré, le
 * nom (un clic ouvre la carte, Ctrl + clic la sélectionne), le rang (l'héroïsme d'un héros), l'attitude (à changer d'un menu), la
 * vitalité réglable pas à pas, la mêlée, le tir, la défense, l'initiative et les dégâts ; au bout, le jet d'un héros, ou le menu « ⋯ »
 * des autres (ouvrir la carte, changer de camp). Chaque pas est enregistré aussitôt et rendu à la page (`changed`). Les deux sections
 * sont les zones de dépôt `adversaires` et `heros` : un personnage glissé depuis les coulisses y entre, une ligne glissée de l'une à
 * l'autre change de camp. Un pas impossible ou en cours marque son bouton `aria-disabled` sans le désactiver.
 */
@Component({
  selector: 'bol-situation',
  imports: [
    AvatarFallbackDirective,
    CdkDrag,
    CdkDragPreview,
    CdkDropList,
    DwGemmesComponent,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    StageDragDirective,
  ],
  templateUrl: './situation.html',
  styleUrl: './situation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SituationComponent {
  private readonly placement = inject(ReservePlacementService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  /** Cartes sélectionnées par Ctrl + clic. */
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** Une vitalité, un héroïsme ou une attitude a été enregistré : la page met la session à jour. */
  readonly changed = output<TableChange>();

  protected readonly attitudes = ATTITUDES;

  /** Portraits qui n'ont pas pu se charger : repli sur l'initiale. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());
  /** Pas en cours d'enregistrement, par personnage et par ressource (« pnj-3:vitalite ») : un autre pas sur la même ressource est
   * ignoré tant que celui-ci n'est pas revenu. Le verrou ne se voit pas : seules les vraies limites grisent un bouton. */
  private readonly pending = signal<ReadonlySet<string>>(new Set());

  private readonly enFaceCards = computed(() => troupe(this.cards()).map((t) => t.card));
  private readonly groupes = computed(() => compagnie(this.cards()));
  protected readonly enFace = computed(() => this.enFaceCards().map((card) => this.ligne(card)));
  protected readonly heros = computed(() => this.groupes().heros.map((card) => this.ligne(card)));
  protected readonly allies = computed(() => this.groupes().allies.map((card) => this.ligne(card)));
  protected readonly vitaliteEnFace = computed(() => totalVitalite(this.enFaceCards()));
  protected readonly vitaliteCompagnie = computed(() => totalVitalite([...this.groupes().heros, ...this.groupes().allies]));

  /** Une zone s'allume pendant un glisser qui peut y finir : pas une ligne qui en part, ni un héros vers les adversaires. */
  protected readonly enFaceDroppable = computed(
    () => this.placement.dragging() && this.placement.originCamp() !== 'adversaires' && this.placement.adversairesDroppable(),
  );
  protected readonly compagnieDroppable = computed(() => this.placement.dragging() && this.placement.originCamp() !== 'heros');
  protected readonly enFaceHot = computed(() => this.placement.hoverCamp() === 'adversaires');
  protected readonly compagnieHot = computed(() => this.placement.hoverCamp() === 'heros');

  /** Aucune liste ne reçoit de ligne : CDK n'est là que pour l'aperçu du glisser. */
  protected readonly rejectDrop = (): boolean => false;

  private ligne(card: TapisCard): Ligne {
    const heroisme = card.heroisme ?? 0;
    return {
      card,
      avatar: this.brokenAvatars().has(card.key) ? null : usableAvatar(card.avatar),
      percent: vitalitePercent(card.vitaliteCourante, card.vitaliteMax),
      low: isLowVitalite(card.vitaliteCourante, card.vitaliteMax),
      tombe: card.vitaliteCourante !== null && card.vitaliteMax !== null && card.vitaliteCourante <= 0,
      vitalite: vitaliteText(card),
      atMax: card.vitaliteCourante !== null && card.vitaliteMax !== null && card.vitaliteCourante >= card.vitaliteMax,
      attitude: card.camp === 'adversaires' ? (ATTITUDES.find((a) => a.value === card.attitude) ?? null) : null,
      heroisme,
      gems: heroismeGems(heroisme),
      melee: stat(card.melee),
      tir: stat(card.tir),
      initiative: stat(card.initiative),
    };
  }

  protected onAvatarError(card: TapisCard): void {
    this.brokenAvatars.update((set) => new Set(set).add(card.key));
  }

  protected onNomClick(card: TapisCard, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      this.selectToggled.emit(card);
    } else {
      this.cardToggled.emit(card);
    }
  }

  protected stepVitalite(card: TapisCard, delta: number): void {
    if (delta > 0 && card.vitaliteCourante !== null && card.vitaliteMax !== null && card.vitaliteCourante >= card.vitaliteMax) {
      return;
    }
    this.save(
      `${card.key}:vitalite`,
      () => this.fightSessionService.applyDamage(this.sessionId(), card.kind, card.pivotId, delta).pipe(map((session) => ({session}))),
      'Impossible de mettre à jour la vitalité.',
    );
  }

  protected stepHeroisme(card: TapisCard, delta: number): void {
    if (!card.sourceId || (delta < 0 && (card.heroisme ?? 0) <= 0)) {
      return;
    }
    const herosId = card.sourceId;
    this.save(
      `${card.key}:heroisme`,
      () => this.herosService.adjustHeroisme(herosId, delta).pipe(map((hero) => ({herosId, heroisme: hero.ressources.heroisme}))),
      "Impossible de mettre à jour l'héroïsme.",
    );
  }

  protected choisirAttitude(card: TapisCard, attitude: CombatantAttitude | null): void {
    if (card.kind === 'hero' || card.attitude === attitude) {
      return;
    }
    const kind = card.kind;
    this.save(
      `${card.key}:attitude`,
      () => this.fightSessionService.setAttitude(this.sessionId(), kind, card.pivotId, attitude).pipe(map((session) => ({session}))),
      "Impossible de changer l'attitude.",
    );
  }

  /** Une ligne déposée sur l'autre section change de camp. */
  protected onStageDropped(camp: CombatCamp | null, card: TapisCard): void {
    if (camp !== null && camp !== card.camp) {
      this.campToggleRequested.emit(card);
    }
  }

  /** Enregistre un pas ; un autre pas sur la même ressource est ignoré tant que celui-ci n'est pas revenu. */
  private save(key: string, request: () => Observable<TableChange>, errorMessage: string): void {
    if (this.pending().has(key)) {
      return;
    }
    this.pending.update((set) => new Set(set).add(key));
    const done = (): void =>
      this.pending.update((set) => {
        const next = new Set(set);
        next.delete(key);
        return next;
      });
    request().subscribe({
      next: (change) => {
        done();
        this.changed.emit(change);
      },
      error: (error: unknown) => {
        done();
        this.snackBar.open(extractApiErrorMessage(error, errorMessage), 'Fermer', {duration: 5000});
      },
    });
  }
}
