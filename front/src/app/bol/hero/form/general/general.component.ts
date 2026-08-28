import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FieldTree, FormField} from '@angular/forms/signals';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {BolRegionModel} from '../../../models/bol-region.model';
import type {HeroFormModel} from '../hero-form-page';

@Component({
  selector: 'bol-hero-general',
  imports: [FormField, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroGeneralComponent {
  readonly form = input.required<FieldTree<HeroFormModel>>();
  readonly regionList = input<readonly BolRegionModel[] | null | undefined>(null);
  readonly compareById = input.required<(a: number | string | null, b: number | string | null) => boolean>();
  readonly showValidationHint = input(false);
}
