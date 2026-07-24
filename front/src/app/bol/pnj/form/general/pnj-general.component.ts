import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FieldTree, FormField} from '@angular/forms/signals';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import type {PnjFormModel} from '../pnj-form-page';

export interface PnjTypeOption {
  readonly label: string;
  readonly value: 'P' | 'C' | 'R';
}

@Component({
  selector: 'bol-pnj-general',
  imports: [FormField, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './pnj-general.component.html',
  styleUrl: './pnj-general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjGeneralComponent {
  readonly form = input.required<FieldTree<PnjFormModel>>();
  readonly typeOptions = input.required<readonly PnjTypeOption[]>();
  readonly showValidationHint = input(false);
}
