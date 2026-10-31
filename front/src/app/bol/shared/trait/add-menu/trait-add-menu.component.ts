import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
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
