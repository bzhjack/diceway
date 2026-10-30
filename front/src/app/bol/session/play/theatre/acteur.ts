import {ChangeDetectionStrategy, Component, computed, input, linkedSignal, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {TapisCard} from '../../models/tapis.model';
import {TroupeTaille} from '../../models/theatre.model';
import {cardAriaLabel, isLowVitalite, vitalitePercent} from '../tapis/tapis.util';
import {ATTITUDES} from './theatre.util';

/** Une carte de la troupe (ou un allié de la compagnie) : portrait en pied, rang, type, nom et barre de
 * vitalité. Sa taille dit son rang. Présentation seule : le clic, avec l'événement, est rendu au parent
 * (Ctrl/Cmd + clic sélectionne, un clic simple ouvre la carte). */
@Component({
  selector: 'bol-acteur',
  imports: [MatIconModule],
  templateUrl: './acteur.html',
  styleUrl: './acteur.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActeurComponent {
  readonly card = input.required<TapisCard>();
  readonly taille = input.required<TroupeTaille>();
  readonly selected = input(false);
  /** « carte » : le portrait en pied ; « plaque » : une ligne, le portrait carré à gauche, le nom et la vie à droite (les alliés de la
   * compagnie, comme les plaques des héros). */
  readonly forme = input<'carte' | 'plaque'>('carte');
  /** Ce que le lecteur d'écran entend en plus du nom (les chances de toucher, quand la carte sert à choisir une cible). */
  readonly detail = input<string | null>(null);
  readonly toggled = output<MouseEvent>();

  /** L'avatar a échoué au chargement : repli sur l'icône du type, jusqu'au prochain changement d'avatar. */
  private readonly avatarFailed = linkedSignal(() => {
    this.card().avatar;
    return false;
  });
  protected readonly hasAvatar = computed(() => this.card().avatar !== EMPTY_AVATAR && !!this.card().avatar && !this.avatarFailed());
  protected readonly kindIcon = computed(() => combatantKindIcon(this.card().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.card().kind));
  /** Attitude envers les héros, montrée pour un personnage du camp d'en face. */
  protected readonly attitude = computed(() => {
    const card = this.card();
    return card.camp === 'adversaires' ? (ATTITUDES.find((a) => a.value === card.attitude) ?? null) : null;
  });
  protected readonly ariaLabel = computed(() => {
    const attitude = this.attitude();
    const label = attitude ? `${cardAriaLabel(this.card())}, ${attitude.label.toLowerCase()}` : cardAriaLabel(this.card());
    const detail = this.detail();
    return detail ? `${label}, ${detail}` : label;
  });
  protected readonly percent = computed(() => vitalitePercent(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly low = computed(() => isLowVitalite(this.card().vitaliteCourante, this.card().vitaliteMax));
  /** À 0 de vitalité ou moins : le portrait passe en gris. */
  protected readonly tombe = computed(() => {
    const vitalite = this.card().vitaliteCourante;
    return vitalite !== null && this.card().vitaliteMax !== null && vitalite <= 0;
  });
  /** Étiquette du coin : « Allié » pour un allié, sinon le rang. */
  protected readonly etiquette = computed(() => (this.taille() === 'allie' ? 'Allié' : this.card().rang));

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }
}
