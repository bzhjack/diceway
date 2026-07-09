import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {BolAvantageModel} from '../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';

export interface TraitAddEvent {
  readonly id: number;
  readonly type: 'A' | 'D';
}

@Component({
  selector: 'bol-trait-add-menu',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
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
  protected readonly selectedId = new FormControl<number | null>(null);

  protected reset(): void {
    this.menuType.set('A');
    this.selectedId.setValue(null);
  }

  protected add(): void {
    const id = this.selectedId.value;
    if (!id) {
      return;
    }

    this.added.emit({id: Number(id), type: this.menuType()});
    this.selectedId.setValue(null);
  }
}
