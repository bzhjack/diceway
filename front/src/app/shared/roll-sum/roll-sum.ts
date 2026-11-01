import {NgTemplateOutlet} from '@angular/common';
import {ChangeDetectionStrategy, Component, contentChild, Directive, input, output, TemplateRef} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DwRollSumTerm} from '../models/roll-sum.model';

/** Le contenu d'un terme marqué `editable` : la page le fournit quand elle laisse saisir une valeur dans l'addition. */
@Directive({selector: 'ng-template[dwRollSumEditable]'})
export class DwRollSumEditableDirective {}

/** L'addition d'un jet, sur une ligne : un nombre par terme, son nom dessous. Trois tailles : `small` dans une ligne de réaction, `medium` dans
 * l'assistant de tour, `large` sur le plateau d'un jet d'action. */
@Component({
  selector: 'dw-roll-sum',
  imports: [NgTemplateOutlet, MatTooltipModule],
  host: {
    '[class]': '"rs rs--" + size()',
    '[class.rs--pending]': 'pending()',
  },
  template: `
    @for (term of terms(); track $index) {
      <span class="rs-term" [class.rs-term--plus]="term.tone === 'plus'" [class.rs-term--minus]="term.tone === 'minus'" [class.rs-term--total]="term.tone === 'total'">
        @if (term.editable && editable(); as custom) {
          <ng-container [ngTemplateOutlet]="custom" [ngTemplateOutletContext]="{$implicit: term}" />
        } @else {
          <b>{{ term.value }}</b>
        }
        <small>{{ term.caption }}</small>
        @if (term.effetId; as id) {
          <button type="button" class="rs-x" [attr.aria-label]="'Retirer l’effet ' + term.caption" matTooltip="Retirer cet effet" (click)="effectRemoved.emit(id)">×</button>
        }
      </span>
    }
  `,
  styleUrl: './roll-sum.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwRollSumComponent {
  readonly terms = input.required<readonly DwRollSumTerm[]>();
  /** Avant le jet, l'addition annonce les termes en plus pâle. */
  readonly pending = input(false);
  readonly size = input<'small' | 'medium' | 'large'>('medium');
  readonly effectRemoved = output<string>();

  protected readonly editable = contentChild(DwRollSumEditableDirective, {read: TemplateRef});
}
