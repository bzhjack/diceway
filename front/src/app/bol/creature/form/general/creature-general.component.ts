import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {BolCreatureTailleModel} from '../../../models/bol-creature.model';

@Component({
  selector: 'bol-creature-general',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './creature-general.component.html',
  styleUrl: './creature-general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureGeneralComponent {
  readonly form = input.required<FormGroup>();
  readonly tailles = input<readonly BolCreatureTailleModel[] | null | undefined>(null);
  readonly compareById = input.required<(a: number | string | null, b: number | string | null) => boolean>();
  readonly avatarPreview = input<string | null>(null);
  readonly showValidationHint = input(false);

  readonly avatarClick = output<void>();
}
