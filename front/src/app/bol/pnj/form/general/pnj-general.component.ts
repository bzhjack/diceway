import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';

export interface PnjTypeOption {
  readonly label: string;
  readonly value: 'P' | 'C' | 'R';
}

@Component({
  selector: 'bol-pnj-general',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './pnj-general.component.html',
  styleUrl: './pnj-general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjGeneralComponent {
  readonly form = input.required<FormGroup>();
  readonly typeOptions = input.required<readonly PnjTypeOption[]>();
  readonly showValidationHint = input(false);
}
