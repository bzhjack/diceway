import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FieldTree, FormField} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {BolRegionModel} from '../../../models/bol-region.model';
import {HeroCreationWarning} from '../../../services/bol-heros-state.service';
import type {HeroAdvancedFormModel} from '../hero-advanced-page';
import {SectionMessage} from '../section-message';

/** Panneau Identité de la création avancée : joueur/nom/commentaire + choix de la région. */
@Component({
  selector: 'bol-hero-advanced-identite',
  imports: [FormField, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './identite.component.html',
  styleUrl: './identite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedIdentiteComponent {
  readonly form = input.required<FieldTree<HeroAdvancedFormModel>>();
  readonly region = input<BolRegionModel | null>(null);
  readonly errors = input<readonly SectionMessage[]>([]);
  readonly warns = input<readonly HeroCreationWarning[]>([]);

  readonly regionPick = output<void>();
  readonly regionClear = output<void>();
}
