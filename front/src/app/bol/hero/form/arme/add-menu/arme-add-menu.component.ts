import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {BolArmeModel} from '../../../../models/bol-arme.model';

@Component({
  selector: 'bol-arme-add-menu',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
  ],
  templateUrl: './arme-add-menu.component.html',
  styleUrl: './arme-add-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmeAddMenuComponent {
  readonly armes = input.required<readonly BolArmeModel[]>();
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
