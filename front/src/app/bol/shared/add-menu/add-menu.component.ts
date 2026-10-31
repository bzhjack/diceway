import {ChangeDetectionStrategy, Component, Signal, computed, input, output, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AddMenuOption, AddMenuEvent} from '../models/add-menu.model';

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
    FormField,
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

  protected readonly selectedId = signal<number | null>(null);
  protected readonly selectedField = form(this.selectedId);
  protected readonly detail = signal('');
  protected readonly detailField = form(this.detail);

  protected reset(): void {
    this.selectedId.set(null);
    this.detail.set('');
  }

  protected add(): void {
    const id = this.selectedId();
    if (!id) {
      return;
    }

    this.added.emit({id: Number(id), detail: this.detail() || null});
    this.reset();
  }
}
