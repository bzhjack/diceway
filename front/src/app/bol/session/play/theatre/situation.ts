import {CdkTrapFocus} from '@angular/cdk/a11y';
import {CdkDrag, CdkDragPreview, CdkDropList} from '@angular/cdk/drag-drop';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSnackBar} from '@angular/material/snack-bar';
import {concat, last, map, Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {usableAvatar} from '../../../../shared/avatar-fallback/avatar.util';
import {TuileComponent} from '../../../shared/tuile/tuile';
import {DwPopoverDirective} from '../../../../shared/popover/popover.directive';
import {AmbianceOption} from '../../models/theatre.model';
import {CombatantAttitude, CombatCamp} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {combatantKindIcon} from '../../combat-statblock.util';
import {TableChange} from '../../models/table-change.model';
import {TapisCard} from '../../models/tapis.model';
import {ReservePlacementService} from '../../reserve-placement.service';
import {StageDragDirective} from '../reserve/stage-drag.directive';
import {isLowVitalite, vitaliteText} from '../tapis/tapis.util';
import {ATTITUDES, compagnie, troupe} from './theatre.util';

/** Un exemplaire sur sa carte : son numéro (« #2 », null s'il est seul) et sa vitalité. */
interface Exemplaire {
  readonly card: TapisCard;
  readonly numero: string | null;
  readonly low: boolean;
  readonly tombe: boolean;
  readonly vitalite: string;
}

/** Une carte de la situation : une fiche et ses exemplaires à la table (deux gardes d'une même fiche, dans le même camp, n'en font
 * qu'une), avec ses valeurs déjà calculées. Ses caractéristiques et son portrait sont ceux du premier exemplaire. */
interface Carte {
  readonly key: string;
  readonly card: TapisCard;
  readonly cards: readonly TapisCard[];
  readonly nom: string;
  readonly avatar: string | null;
  readonly exemplaires: readonly Exemplaire[];
  /** L'attitude commune aux exemplaires, null sans attitude ou s'ils diffèrent. */
  readonly attitude: AmbianceOption<CombatantAttitude> | null;
  /** L'infobulle du point de l'attitude : « Méfiant », « Méfiants », « Attitudes diverses », « Sans attitude ». */
  readonly attitudeTitre: string;
  /** Les exemplaires n'ont pas tous la même attitude. */
  readonly attitudesDiverses: boolean;
  readonly tombe: boolean;
  /** Un exemplaire au moins est bas ou à terre (sans qu'ils le soient tous) : le cœur d'un groupe s'assombrit. */
  readonly basse: boolean;
  /** La vitalité de tous ses exemplaires : « 10/12 ». */
  readonly vitaliteTotale: string;
  readonly heroisme: number;
  /** Sa sorte, en infobulle de son icône : « PNJ », « Créature », « Démon » (vide pour un héros). */
  readonly type: string;
  readonly icone: string;
}

const TYPES: Record<TapisCard['kind'], string> = {hero: '', pnj: 'PNJ', creature: 'Créature', demon: 'Démon'};

/** Le pluriel d'une attitude : « méfiants », « amicaux ». */
const PLURIELS: Record<CombatantAttitude, string> = {hostile: 'hostiles', mefiant: 'méfiants', neutre: 'neutres', amical: 'amicaux'};

/** Les attitudes d'un camp, comptées dans leur ordre (de la plus hostile à la plus amicale) : « 1 hostile, 3 méfiants » ; ceux sans
 * attitude en dernier. */
function compteDesAttitudes(cards: readonly TapisCard[]): string {
  const parties = ATTITUDES.map((a) => {
    const n = cards.filter((c) => c.attitude === a.value).length;
    return n ? `${n} ${n > 1 ? PLURIELS[a.value] : a.label.toLowerCase()}` : null;
  }).filter((p): p is string => p !== null);
  const sans = cards.filter((c) => c.attitude === null).length;
  return [...parties, ...(sans ? [`${sans} sans attitude`] : [])].join(', ');
}

/** Le nom d'un exemplaire sans son numéro de table : « Soldat du guet #2 » → « Soldat du guet ». */
const NUMERO = /\s#(\d+)$/;

/** Les cartes de la table regroupées par fiche, dans leur ordre : les exemplaires d'une même fiche dans le même camp se suivent sur une
 * carte ; un héros reste seul. */
function regrouper(cards: readonly TapisCard[]): TapisCard[][] {
  const groupes = new Map<string, TapisCard[]>();
  for (const card of cards) {
    const cle = card.kind === 'hero' || !card.sourceId ? card.key : `${card.kind}|${card.sourceId}|${card.camp}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), card]);
  }
  return [...groupes.values()];
}

/** La vitalité totale d'un groupe de cartes : « 29/31 ». */
function totalVitalite(cards: readonly TapisCard[]): string {
  const courante = cards.reduce((n, c) => n + Math.max(0, c.vitaliteCourante ?? 0), 0);
  const max = cards.reduce((n, c) => n + (c.vitaliteMax ?? 0), 0);
  return `${courante}/${max}`;
}

/**
 * La situation de la table, hors combat : les deux camps côte à côte, en tuiles comme la distribution de « Préparer la scène », tout en
 * vue sans défiler. À gauche ceux d'en face (rangés par rang, avec le compte de leurs attitudes et « Ajouter »), à droite la compagnie :
 * ses héros, puis ses alliés. Les exemplaires d'une même fiche n'ont qu'une tuile, empilée en paquet, un cœur chacun. Chaque tuile est
 * réduite à l'essentiel, pour une vue d'ensemble : le portrait, et posés dessus le nombre d'exemplaires et un cœur (la vitalité
 * dedans pour un personnage seul ; vide pour un groupe, il ouvre le détail de chaque exemplaire) ; le nom suivi du point de l'attitude
 * de ceux d'en face (son nom en infobulle, son menu d'un clic), le rang et l'icône de la sorte. Un héros a un pied : ses points
 * d'héroïsme dans un écusson et son jet. Un clic n'importe où sur la tuile ouvre la carte du personnage, où se règlent sa vitalité et son
 * héroïsme ; Ctrl + clic la sélectionne. L'attitude est
 * enregistrée aussitôt et rendue à la page (`changed`). Les deux camps sont les zones de dépôt `adversaires` et `heros` : un
 * personnage glissé depuis les coulisses y entre, une tuile glissée de l'un à l'autre change de camp.
 */
@Component({
  selector: 'bol-situation',
  imports: [
    AvatarFallbackDirective,
    CdkConnectedOverlay,
    CdkDrag,
    CdkDragPreview,
    CdkDropList,
    CdkOverlayOrigin,
    CdkTrapFocus,
    DwPopoverDirective,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    NgTemplateOutlet,
    StageDragDirective,
    TuileComponent,
  ],
  templateUrl: './situation.html',
  styleUrl: './situation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SituationComponent {
  private readonly placement = inject(ReservePlacementService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly cards = input.required<readonly TapisCard[]>();
  readonly sessionId = input.required<string>();
  /** Cartes sélectionnées par Ctrl + clic. */
  readonly selectedKeys = input<ReadonlySet<string>>(new Set());
  readonly cardToggled = output<TapisCard>();
  readonly selectToggled = output<TapisCard>();
  readonly campToggleRequested = output<TapisCard>();
  /** Une attitude a été enregistrée : la page met la session à jour. */
  readonly changed = output<TableChange>();
  /** « Ajouter », dans l'en-tête de ceux d'en face : la page ouvre les coulisses. */
  readonly ajouterDemande = output<void>();
  /** Les coulisses sont ouvertes (pour l'état du bouton « Ajouter »). */
  readonly coulissesOpen = input(false);

  protected readonly attitudes = ATTITUDES;
  /** La tuile (sa clé) dont le détail de la vie est ouvert. */
  protected readonly vieOuverte = signal<string | null>(null);

  /** Attitudes en cours d'enregistrement, par carte : un autre choix sur la même carte est ignoré tant que celui-ci n'est pas revenu. */
  private readonly pending = signal<ReadonlySet<string>>(new Set());

  private readonly enFaceCards = computed(() => troupe(this.cards()).map((t) => t.card));
  private readonly groupes = computed(() => compagnie(this.cards()));
  protected readonly enFace = computed(() => regrouper(this.enFaceCards()).map((cards) => this.carte(cards)));
  protected readonly heros = computed(() => this.groupes().heros.map((card) => this.carte([card])));
  protected readonly allies = computed(() => regrouper(this.groupes().allies).map((cards) => this.carte(cards)));
  protected readonly nombreEnFace = computed(() => this.enFaceCards().length);
  protected readonly nombreAllies = computed(() => this.groupes().allies.length);
  protected readonly vitaliteEnFace = computed(() => totalVitalite(this.enFaceCards()));
  protected readonly vitaliteCompagnie = computed(() => totalVitalite([...this.groupes().heros, ...this.groupes().allies]));
  /** Les attitudes de ceux d'en face, comptées : « 1 hostile, 3 méfiants, 1 neutre ». */
  protected readonly attitudesEnFace = computed(() => compteDesAttitudes(this.enFaceCards()));

  /** Une zone s'allume pendant un glisser qui peut y finir : pas une ligne qui en part, ni un héros vers les adversaires. */
  protected readonly enFaceDroppable = computed(
    () => this.placement.dragging() && this.placement.originCamp() !== 'adversaires' && this.placement.adversairesDroppable(),
  );
  protected readonly compagnieDroppable = computed(() => this.placement.dragging() && this.placement.originCamp() !== 'heros');
  protected readonly enFaceHot = computed(() => this.placement.hoverCamp() === 'adversaires');
  protected readonly compagnieHot = computed(() => this.placement.hoverCamp() === 'heros');

  /** Aucune liste ne reçoit de ligne : CDK n'est là que pour l'aperçu du glisser. */
  protected readonly rejectDrop = (): boolean => false;

  private carte(cards: readonly TapisCard[]): Carte {
    const card = cards[0];
    const plusieurs = cards.length > 1;
    const attitudes = new Set(cards.map((c) => c.attitude));
    const commune = attitudes.size === 1 ? (ATTITUDES.find((a) => a.value === card.attitude) ?? null) : null;
    const attitude = card.camp === 'adversaires' ? commune : null;
    const heroisme = card.heroisme ?? 0;
    const exemplaires = cards.map((c, index): Exemplaire => ({
      card: c,
      numero: plusieurs ? `#${NUMERO.exec(c.nom)?.[1] ?? index + 1}` : null,
      low: isLowVitalite(c.vitaliteCourante, c.vitaliteMax),
      tombe: c.vitaliteCourante !== null && c.vitaliteMax !== null && c.vitaliteCourante <= 0,
      vitalite: vitaliteText(c),
    }));
    return {
      key: card.key,
      card,
      cards,
      nom: plusieurs ? card.nom.replace(NUMERO, '') : card.nom,
      avatar: usableAvatar(card.avatar),
      exemplaires,
      attitude,
      attitudeTitre: attitude
        ? plusieurs
          ? PLURIELS[attitude.value].replace(/^./, (l) => l.toUpperCase())
          : attitude.label
        : attitudes.size > 1
          ? 'Attitudes diverses'
          : 'Sans attitude',
      attitudesDiverses: card.camp === 'adversaires' && attitudes.size > 1,
      tombe: exemplaires.every((e) => e.tombe),
      basse: exemplaires.some((e) => e.low || e.tombe) && !exemplaires.every((e) => e.tombe),
      vitaliteTotale: totalVitalite(cards),
      heroisme,
      type: TYPES[card.kind],
      icone: combatantKindIcon(card.kind),
    };
  }

  /** Un exemplaire au moins est sélectionné (Ctrl + clic). */
  protected selectionnee(carte: Carte): boolean {
    return carte.cards.some((c) => this.selectedKeys().has(c.key));
  }

  /** Un clic sur la tuile (le portrait la couvre, hors de ses autres boutons) ouvre le détail du personnage (du premier exemplaire), où se
   * règlent sa vitalité et son héroïsme ; Ctrl + clic sélectionne tous les exemplaires. */
  protected onPortraitClick(carte: Carte, event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey) {
      carte.cards.forEach((c) => this.selectToggled.emit(c));
    } else {
      this.cardToggled.emit(carte.card);
    }
  }

  /** Une ligne du détail de la vie d'un groupe ouvre la carte de son exemplaire. */
  protected ouvrirExemplaire(card: TapisCard): void {
    this.vieOuverte.set(null);
    this.cardToggled.emit(card);
  }

  protected touche(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.vieOuverte.set(null);
    }
  }

  /** L'attitude choisie vaut pour tous les exemplaires de la carte : chacun est enregistré à son tour, la page reçoit la table à la fin. */
  protected choisirAttitude(cards: readonly TapisCard[], attitude: CombatantAttitude | null): void {
    const aChanger = cards.filter((c) => c.kind !== 'hero' && c.attitude !== attitude);
    if (!aChanger.length) {
      return;
    }
    this.save(
      `${cards[0].key}:attitude`,
      () =>
        concat(
          ...aChanger.map((c) => this.fightSessionService.setAttitude(this.sessionId(), c.kind as 'pnj' | 'creature' | 'demon', c.pivotId, attitude)),
        ).pipe(
          last(),
          map((session) => ({session})),
        ),
      "Impossible de changer l'attitude.",
    );
  }

  /** Tous les exemplaires de la tuile changent de camp. */
  protected changerDeCamp(carte: Carte): void {
    carte.cards.forEach((c) => this.campToggleRequested.emit(c));
  }

  /** Une tuile déposée sur l'autre camp en change (c'est la seule façon d'en changer). */
  protected onStageDropped(camp: CombatCamp | null, carte: Carte): void {
    if (camp !== null && camp !== carte.card.camp) {
      this.changerDeCamp(carte);
    }
  }

  /** Enregistre un changement ; un autre sur la même carte est ignoré tant que celui-ci n'est pas revenu. */
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
