import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {combatantKindIcon, combatantKindIconIsSvg} from '../../combat-statblock.util';
import {PlayToken} from '../../combat-play.util';

/** Ruban d'initiative en haut de l'écran de combat : ordre des combattants, réordonnable par
 * glisser-déposer (persisté par le parent), ajout/retrait d'un combattant en cours de combat. */
@Component({
  selector: 'bol-initiative-rail',
  imports: [MatIconModule, DragDropModule],
  templateUrl: './initiative-rail.html',
  styleUrl: './initiative-rail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitiativeRailComponent {
  readonly tokens = input.required<readonly PlayToken[]>();
  readonly activeKey = input<string | null>(null);

  /** Nouvel ordre des clés de jeton après un glisser-déposer — au parent de le persister. */
  readonly reordered = output<readonly string[]>();
  readonly addCombatant = output<void>();
  readonly removeCombatant = output<PlayToken>();

  protected readonly kindIcon = combatantKindIcon;
  protected readonly kindIconIsSvg = combatantKindIconIsSvg;

  protected chipClass(token: PlayToken): string {
    const active = token.key === this.activeKey() ? ' cp-rail-chip--active' : '';
    return `cp-rail-chip cp-rail-chip--${token.kind}${active}`;
  }

  protected onDrop(event: CdkDragDrop<PlayToken[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const keys = this.tokens().map((t) => t.key);
    moveItemInArray(keys, event.previousIndex, event.currentIndex);
    this.reordered.emit(keys);
  }

  protected onRemove(token: PlayToken, event: Event): void {
    event.stopPropagation();
    this.removeCombatant.emit(token);
  }
}
