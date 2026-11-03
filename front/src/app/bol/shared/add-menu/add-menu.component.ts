import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  Signal,
  ViewEncapsulation,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {A11yModule, CdkTrapFocus} from '@angular/cdk/a11y';
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
    A11yModule,
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
  // Le menu s'ouvre dans un overlay : ses styles doivent l'atteindre (voir la feuille).
  encapsulation: ViewEncapsulation.None,
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

  private readonly injector = inject(Injector);
  private readonly contentTrap = viewChild.required(CdkTrapFocus);

  /** Le dernier clic sur « + » venait du clavier (Entrée, Espace : un clic sans compte de clics). */
  private openedByKeyboard = false;

  protected noteOpening(event: MouseEvent): void {
    this.openedByKeyboard = event.detail === 0;
  }

  /**
   * Ouvert au clavier, le menu n'a pas d'élément de menu où poser le focus : `mat-menu` le laisse sur le bouton « + ». Il entre
   * dans le premier champ. À la souris, rien ne change.
   */
  protected onMenuOpened(): void {
    this.reset();
    afterNextRender(
      () => {
        if (this.openedByKeyboard) {
          this.contentTrap().focusTrap.focusFirstTabbableElement();
        }
      },
      {injector: this.injector},
    );
  }

  /** Tab passe d'un champ à l'autre du menu au lieu de le fermer (`mat-menu` se ferme sur Tab). */
  protected keepOpenOnTab(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.stopPropagation();
    }
  }

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
