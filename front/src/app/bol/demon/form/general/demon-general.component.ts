import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {BolDemonCategorieModel} from '../../../models/bol-demon.model';

@Component({
  selector: 'bol-demon-general',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './demon-general.component.html',
  styleUrl: './demon-general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonGeneralComponent {
  readonly form = input.required<FormGroup>();
  readonly categories = input<readonly BolDemonCategorieModel[] | null | undefined>(null);
  readonly compareById = input.required<(a: number | string | null, b: number | string | null) => boolean>();
  readonly avatarPreview = input<string | null>(null);
  readonly showValidationHint = input(false);

  readonly avatarClick = output<void>();
}
