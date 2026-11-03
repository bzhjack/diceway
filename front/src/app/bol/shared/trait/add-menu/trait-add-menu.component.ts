import {
  ChangeDetectionStrategy,
  Component,
  Injector,
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
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolAvantageModel} from '../../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../../models/bol-desavantage.model';
import {TraitAddEvent} from '../../models/trait-add-menu.model';

@Component({
  selector: 'bol-trait-add-menu',
  imports: [
    A11yModule,
    FormField,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './trait-add-menu.component.html',
  styleUrl: './trait-add-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Le menu s'ouvre dans un overlay : ses styles doivent l'atteindre (voir la feuille).
  encapsulation: ViewEncapsulation.None,
})
export class TraitAddMenuComponent {
  readonly avantages = input.required<readonly BolAvantageModel[]>();
  readonly desavantages = input.required<readonly BolDesavantageModel[]>();
  readonly added = output<TraitAddEvent>();

  protected readonly menuType = signal<'A' | 'D'>('A');
  protected readonly selectedId = signal<number | null>(null);
  protected readonly selectedField = form(this.selectedId);
  /** Option courante, pour afficher le badge régional dans le trigger fermé du select. */
  protected readonly selectedAvantage = computed(
    () => this.avantages().find((avantage) => avantage.id === this.selectedId()) ?? null,
  );
  protected readonly selectedDesavantage = computed(
    () => this.desavantages().find((desavantage) => desavantage.id === this.selectedId()) ?? null,
  );

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
    this.menuType.set('A');
    this.selectedId.set(null);
  }

  protected add(): void {
    const id = this.selectedId();
    if (!id) {
      return;
    }

    this.added.emit({id: Number(id), type: this.menuType()});
    this.selectedId.set(null);
  }
}
