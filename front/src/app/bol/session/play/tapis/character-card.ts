import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {EMPTY_AVATAR} from '../../combat-play.util';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {CardCombatState} from '../../models/combat-turn.model';
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
  readonly toggled = output<void>();
  /** État de la carte dans le combat — `null` en mode libre. */
  readonly combat = input<CardCombatState | null>(null);
  /** Bouton « déplier » de la face, affiché en combat (le clic sur la face y sert à attaquer). */
  readonly expandRequested = output<void>();

  /** L'avatar a échoué au chargement (chemin conventionnel sans fichier) : repli sur l'icône du type. */
  private readonly avatarFailed = signal(false);
  protected readonly hasAvatar = computed(() => this.card().avatar !== EMPTY_AVATAR && !this.avatarFailed());

  /** Libellé accessible : en combat, une carte désignable s'annonce comme une cible, et l'état de la
   * carte dans le round est dit. */
  protected readonly ariaLabel = computed(() => {
    const base = cardAriaLabel(this.card());
    const combat = this.combat();
    if (!combat) {
      return base;
    }

    const states = [
      combat.out ? 'hors combat' : null,
      combat.status === 'active' ? 'à elle de jouer' : null,
      combat.status === 'played' ? 'a joué' : null,
      combat.locked ? 'bloquée ce round' : null,
      combat.defenseTotale ? 'en défense totale' : null,
    ].filter((state): state is string => state !== null);
    const described = states.length ? `${base}, ${states.join(', ')}` : base;
    return combat.targetable ? `Attaquer ${described}` : described;
  });
  protected readonly vitalite = computed(() => vitaliteText(this.card()));
  protected readonly percent = computed(() => vitalitePercent(this.card().vitaliteCourante, this.card().vitaliteMax));
  protected readonly low = computed(() => isLowVitalite(this.card().vitaliteCourante, this.card().vitaliteMax));

  protected readonly kindIcon = computed(() => combatantKindIcon(this.card().kind));
  protected readonly kindIconIsSvg = computed(() => combatantKindIconIsSvg(this.card().kind));

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  protected instanceLow(value: number): boolean {
    return isLowVitalite(value, this.card().vitaliteMax);
  }

  protected instanceLabel(index: number, value: number): string {
    return `exemplaire ${index + 1} : ${value} sur ${this.card().vitaliteMax ?? '—'}`;
  }
}
