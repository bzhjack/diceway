import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolArmureModel} from '../../../models/bol-armure.model';

@Component({
  selector: 'bol-armure-add-menu',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './armure-add-menu.component.html',
  styleUrl: './armure-add-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmureAddMenuComponent {
  readonly armures = input.required<readonly BolArmureModel[]>();
  readonly added = output<number>();

  protected readonly selectedId = new FormControl<number | null>(null);

  protected reset(): void {
    this.selectedId.setValue(null);
  }

  protected add(): void {
    const id = this.selectedId.value;
    if (!id) {
      return;
    }

    this.added.emit(Number(id));
    this.selectedId.setValue(null);
  }
}
