import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FieldTree, FormField} from '@angular/forms/signals';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {BolCreatureTailleModel} from '../../../models/bol-creature.model';
import type {CreatureFormModel} from '../creature-form-page';

@Component({
  selector: 'bol-creature-general',
  imports: [FormField, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './creature-general.component.html',
  styleUrl: './creature-general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureGeneralComponent {
  readonly form = input.required<FieldTree<CreatureFormModel>>();
  readonly tailles = input<readonly BolCreatureTailleModel[] | null | undefined>(null);
  readonly compareById = input.required<(a: number | string | null, b: number | string | null) => boolean>();
  readonly avatarPreview = input<string | null>(null);
  readonly showValidationHint = input(false);

  readonly avatarClick = output<void>();
}
