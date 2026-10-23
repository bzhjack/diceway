import {CdkDrag, CdkDragEnd, CdkDragMove, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {heroismeGems} from '../../heroisme-spend.util';
import {TapisCard} from '../../models/tapis.model';
import {ReservePlacementService} from '../../reserve-placement.service';
import {isLowVitalite, vitalitePercent, vitaliteText} from '../tapis/tapis.util';
import {ActeurComponent} from './acteur';
import {compagnie} from './theatre.util';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';

/** La plaque d'un héros, avec ses valeurs déjà calculées. */
interface Plaque {
  readonly card: TapisCard;
  readonly avatar: string | null;
  readonly percent: number;
  readonly low: boolean;
  readonly vitalite: string;
  readonly heroisme: number;
  readonly gems: readonly boolean[];
  readonly atMax: boolean;
}

/** La compagnie, en pied du plateau : une plaque par héros (portrait, joueur, vitalité et héroïsme réglables
 * pas à pas, chaque pas enregistré tout de suite ; un dé en haut à droite ouvre sa carte et son jet d'action), puis les alliés en petites cartes. Un pas impossible ou en cours
 * marque son bouton `aria-disabled` sans le désactiver : le focus clavier reste dessus. C'est la zone de dépôt
 * `heros`. Signale à la page (`changed`) chaque valeur enregistrée, pour qu'elle recharge la session. */
@Component({
  selector: 'bol-compagnie',
  imports: [AvatarFallbackDirective, CdkDrag, CdkDragPreview, CdkDropList, MatIconModule, MatTooltipModule, ActeurComponent],
  templateUrl: './compagnie.html',
  styleUrl: './compagnie.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompagnieComponent {
  private readonly placement = inject(ReservePlacementService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** Une vitalité ou un héroïsme a été enregistré : la page recharge la session. */
  readonly changed = output<void>();

  /** Portraits qui n'ont pas pu se charger : repli sur l'initiale. */
  private readonly brokenAvatars = signal<ReadonlySet<string>>(new Set());
  /** Pas en cours d'enregistrement, par héros et par ressource (« hero-1:vitalite ») : un autre pas sur la même ressource est
   * ignoré tant que celui-ci n'est pas revenu ; l'autre ressource reste libre. Le verrou ne se voit pas : seules les vraies
   * limites (vitalité au maximum, héroïsme à 0) grisent un bouton — sinon chaque clic faisait scintiller toute la plaque. */
  private readonly pending = signal<ReadonlySet<string>>(new Set());

  private readonly groupes = computed(() => compagnie(this.cards()));
  protected readonly allies = computed(() => this.groupes().allies);
  protected readonly plaques = computed<readonly Plaque[]>(() =>
    this.groupes().heros.map((card) => ({
      card,
      avatar: card.avatar && card.avatar !== EMPTY_AVATAR && !this.brokenAvatars().has(card.key) ? card.avatar : null,
      percent: vitalitePercent(card.vitaliteCourante, card.vitaliteMax),
      low: isLowVitalite(card.vitaliteCourante, card.vitaliteMax),
      vitalite: vitaliteText(card),
      heroisme: card.heroisme ?? 0,
      gems: heroismeGems(card.heroisme ?? 0),
      atMax: card.vitaliteCourante !== null && card.vitaliteMax !== null && card.vitaliteCourante >= card.vitaliteMax,
    })),
  );

  /** L'échelle des plaques selon la taille de la compagnie : plus grandes à deux ou trois, resserrées au-delà de six. */
  protected readonly scale = computed(() => {
    const count = this.plaques().length;
    return count <= 3 ? 1.25 : count === 4 ? 1.12 : count <= 6 ? 1 : 0.9;
  });

  protected readonly droppable = computed(() => this.placement.dragging() && this.placement.originCamp() !== 'heros');
  protected readonly hot = computed(() => this.placement.hoverCamp() === 'heros');
  protected readonly rejectDrop = (): boolean => false;

  protected onAvatarError(card: TapisCard): void {
    this.brokenAvatars.update((set) => new Set(set).add(card.key));
  }

  protected onFaceClick(card: TapisCard, event: MouseEvent): void {
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
    this.save(`${card.key}:vitalite`, () => this.fightSessionService.applyDamage(this.sessionId(), 'hero', card.pivotId, delta), 'Impossible de mettre à jour la vitalité.');
  }

  protected stepHeroisme(card: TapisCard, delta: number): void {
    if (!card.sourceId || (delta < 0 && (card.heroisme ?? 0) <= 0)) {
      return;
    }
    const herosId = card.sourceId;
    this.save(`${card.key}:heroisme`, () => this.herosService.adjustHeroisme(herosId, delta), "Impossible de mettre à jour l'héroïsme.");
  }

  /** Enregistre un pas ; un autre pas sur la même ressource est ignoré (sa requête n'est même pas construite) tant que
   * celui-ci n'est pas revenu. */
  private save(key: string, request: () => Observable<unknown>, errorMessage: string): void {
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
      next: () => {
        done();
        this.changed.emit();
      },
      error: (error: unknown) => {
        done();
        this.snackBar.open(extractApiErrorMessage(error, errorMessage), 'Fermer', {duration: 5000});
      },
    });
  }

  protected onDragStarted(card: TapisCard): void {
    this.placement.startDrag([card.kind], card.camp);
  }

  protected onDragMoved(event: CdkDragMove): void {
    this.placement.hoverCamp.set(this.placement.campAt(event.pointerPosition.x, event.pointerPosition.y));
  }

  /** Un allié déposé sur la troupe retourne avec les présents. */
  protected onDragEnded(event: CdkDragEnd, card: TapisCard): void {
    const camp = this.placement.campAt(event.dropPoint.x, event.dropPoint.y);
    this.placement.endDrag();
    event.source.reset();
    if (camp !== null && camp !== card.camp) {
      this.campToggleRequested.emit(card);
    }
  }
}
