import {ChangeDetectionStrategy, Component, Signal, computed, input, output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';

/** Option du menu d'ajout ; `detail` est le texte grisé affiché après le libellé. */
export interface AddMenuOption {
  readonly id: number;
  readonly label: string;
  readonly detail?: string | null;
}

/** Sélection émise ; `detail` vient du champ libre (visible avec `withDetail`). */
export interface AddMenuEvent {
  readonly id: number;
  readonly detail: string | null;
}

/** Projette une liste de catalogue vers les options du menu d'ajout. */
export function addMenuOptions<T extends {id?: number | string | null}>(
  list: () => readonly T[],
  label: (item: T) => string,
  detail?: (item: T) => string | null,
): Signal<AddMenuOption[]> {
  return computed(() =>
    list().map((item) => ({
      id: Number(item.id),
      label: label(item),
      detail: detail?.(item) ?? null,
    })),
  );
}

/**
 * Menu d'ajout générique d'un élément de catalogue (arme, armure, carrière, langue,
 * pouvoir, capacité) : bouton "+" ouvrant un select, avec champ détail optionnel.
 */
@Component({
  selector: 'bol-add-menu',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './add-menu.component.html',
  styleUrl: './add-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddMenuComponent {
  readonly options = input.required<readonly AddMenuOption[]>();
  /** Libellé du champ select (ex. « Arme »). */
  readonly label = input.required<string>();
  /** Tooltip/aria-label du bouton "+" (ex. « Ajouter une arme »). */
  readonly triggerLabel = input.required<string>();
  /** Libellé du bouton de validation (ex. « Ajouter l'arme »). */
  readonly addLabel = input.required<string>();
  readonly emptyLabel = input('— Aucune —');
  /** Affiche le champ « Détail (optionnel) » (pouvoirs, capacités). */
  readonly withDetail = input(false);

  readonly added = output<AddMenuEvent>();

  protected readonly selectedId = new FormControl<number | null>(null);
  protected readonly detailControl = new FormControl<string>('', {nonNullable: true});

  protected reset(): void {
    this.selectedId.setValue(null);
    this.detailControl.setValue('');
  }

  protected add(): void {
    const id = this.selectedId.value;
    if (!id) {
      return;
    }

    this.added.emit({id: Number(id), detail: this.detailControl.value || null});
    this.reset();
  }
}
