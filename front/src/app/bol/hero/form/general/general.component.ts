import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {BolRegionModel} from '../../../models/bol-region.model';

@Component({
  selector: 'bol-hero-general',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroGeneralComponent {
  readonly form = input.required<FormGroup>();
  readonly avatarPreview = input<string | null>(null);
  readonly selectedRegion = input<BolRegionModel | null>(null);
  readonly regionList = input<readonly BolRegionModel[] | null | undefined>(null);
  readonly compareById = input.required<(a: number | string | null, b: number | string | null) => boolean>();
  readonly showValidationHint = input(false);

  readonly avatarClick = output<void>();
}
