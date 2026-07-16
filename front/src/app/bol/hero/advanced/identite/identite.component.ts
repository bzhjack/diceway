import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {BolRegionModel} from '../../../models/bol-region.model';
import {HeroCreationWarning} from '../../../services/bol-heros-state.service';
import {SectionMessage} from '../section-message';

/** Panneau Identité de la création avancée : joueur/nom/commentaire + choix de la région. */
@Component({
  selector: 'bol-hero-advanced-identite',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './identite.component.html',
  styleUrl: './identite.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedIdentiteComponent {
  readonly form = input.required<FormGroup>();
  readonly region = input<BolRegionModel | null>(null);
  readonly errors = input<readonly SectionMessage[]>([]);
  readonly warns = input<readonly HeroCreationWarning[]>([]);

  readonly regionPick = output<void>();
  readonly regionClear = output<void>();
}
