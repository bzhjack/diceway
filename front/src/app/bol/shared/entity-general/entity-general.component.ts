import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FieldTree, FormField} from '@angular/forms/signals';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {DwAvatarPickerComponent} from '../../../shared/dw-avatar-picker/dw-avatar-picker';
import {EntityGeneralOption} from '../models/entity-general.model';

/** Le bloc « Général » d'une créature ou d'un démon : portrait, nom, commentaire et ce qui les classe (taille, catégorie). */
@Component({
  selector: 'bol-entity-general',
  imports: [FormField, MatFormFieldModule, MatInputModule, MatSelectModule, DwAvatarPickerComponent],
  templateUrl: './entity-general.component.html',
  styleUrl: './entity-general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityGeneralComponent {
  readonly nom = input.required<FieldTree<string>>();
  readonly commentaire = input.required<FieldTree<string>>();
  readonly classement = input.required<FieldTree<number | null>>();
  readonly nomLabel = input.required<string>();
  readonly classementLabel = input.required<string>();
  readonly options = input.required<readonly EntityGeneralOption[]>();
  readonly compareById = input.required<(a: number | string | null, b: number | string | null) => boolean>();
  readonly avatarPreview = input<string | null>(null);
  readonly avatarLabel = input.required<string>();
  readonly showValidationHint = input(false);
  readonly validationHint = input.required<string>();

  readonly avatarClick = output<void>();
}
