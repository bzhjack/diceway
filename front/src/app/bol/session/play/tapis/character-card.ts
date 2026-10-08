import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {cardAriaLabel, isLowVitalite, vitalitePercent, vitaliteText} from './tapis.util';
import {TapisCard} from '../../models/tapis.model';

/** Face d'une carte du tapis : nom, étiquette, avatar et les trois chiffres du combat (dégâts,
 * défense, vitalité), aux mêmes endroits pour tous les types. Présentation seule : un clic demande
 * de la déplier. */
@Component({
  selector: 'bol-character-card',
  imports: [MatIconModule],
  templateUrl: './character-card.html',
  styleUrl: './character-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterCardComponent {
  readonly card = input.required<TapisCard>();
  /** Le clic sur la face, avec l'événement : Ctrl ou Cmd + clic sélectionne au lieu d'ouvrir. */
  readonly toggled = output<MouseEvent>();
  /** La carte fait partie de la sélection (Ctrl + clic) : un suppr les retire de la table. */
  readonly selected = input(false);

  /** L'avatar a échoué au chargement (chemin conventionnel sans fichier) : repli sur l'icône du type. */
  private readonly avatarFailed = signal(false);
  protected readonly hasAvatar = computed(() => this.card().avatar !== EMPTY_AVATAR && !this.avatarFailed());

  protected readonly ariaLabel = computed(() => cardAriaLabel(this.card()));
  protected readonly vitalite = computed(() => vitaliteText(this.card()));
  protected readonly percent = computed(() => vitalitePercent(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly low = computed(() => isLowVitalite(this.card().vitaliteCourante, this.card().vitaliteMax));

  protected readonly kindIcon = computed(() => combatantKindIcon(this.card().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.card().kind));

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }
}
