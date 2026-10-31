import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {AddMenuComponent} from '../add-menu/add-menu.component';
import {AddMenuEvent, AddMenuOption} from '../models/add-menu.model';

/** Une liste d'une fiche (carrières, armes, armures, capacités, pouvoirs) : son titre, son compteur et son menu d'ajout ; la liste elle-même est
 * projetée dessous. */
@Component({
  selector: 'bol-list-panel',
  imports: [DwTagComponent, AddMenuComponent],
  template: `
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <p class="dw-section-eyebrow">{{ title() }}</p>
        <dw-tag>{{ count() }} {{ countLabel() }}</dw-tag>
      </div>

      <bol-add-menu
        [options]="options()"
        [label]="label()"
        [triggerLabel]="triggerLabel()"
        [addLabel]="addLabel()"
        [emptyLabel]="emptyLabel()"
        [withDetail]="withDetail()"
        (added)="added.emit($event)"
      />
    </div>

    <ng-content />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPanelComponent {
  readonly title = input.required<string>();
  readonly count = input.required<number>();
  readonly countLabel = input('sélectionnée(s)');
  readonly options = input.required<readonly AddMenuOption[]>();
  readonly label = input.required<string>();
  readonly triggerLabel = input.required<string>();
  readonly addLabel = input.required<string>();
  readonly emptyLabel = input('— Aucune —');
  readonly withDetail = input(false);

  readonly added = output<AddMenuEvent>();
}
