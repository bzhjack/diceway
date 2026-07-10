import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolDemonPouvoirModel} from '../../../models/bol-demon.model';

export interface PouvoirAddEvent {
  readonly id: number;
  readonly detail: string | null;
}

@Component({
  selector: 'bol-pouvoir-add-menu',
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
  templateUrl: './pouvoir-add-menu.component.html',
  styleUrl: './pouvoir-add-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PouvoirAddMenuComponent {
  readonly pouvoirs = input.required<readonly BolDemonPouvoirModel[]>();
  readonly added = output<PouvoirAddEvent>();

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
    this.selectedId.setValue(null);
    this.detailControl.setValue('');
  }
}
