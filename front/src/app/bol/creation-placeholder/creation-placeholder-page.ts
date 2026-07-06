import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {DwTagComponent} from '../../shared/dw-tag/dw-tag';

interface CreationDefinition {
  readonly label: string;
  readonly helper: string;
  readonly icon: string;
}

@Component({
  selector: 'app-creation-placeholder-page',
  imports: [RouterLink, MatButtonModule, MatCard, MatCardContent, MatIconModule, DwTagComponent],
  templateUrl: './creation-placeholder-page.html',
  styleUrl: './creation-placeholder-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationPlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly placeholderId = computed(() => this.routeParamMap().get('id'));
  private readonly definitions: Record<string, CreationDefinition> = {
    campaign: {
      label: 'campagne',
      helper: 'Préparer un nouvel arc, ses tables et ses sessions associées.',
      icon: 'explore',
    },
    table: {
      label: 'table',
      helper: 'Créer une table jouable avant d entrer dans le cockpit de session.',
      icon: 'account_tree',
    },
    hero: {
      label: 'Héros',
      helper: 'Ajouter un protagoniste prêt à assigner à une table.',
      icon: 'shield',
    },
    'hero-advanced': {
      label: 'Héros avancé',
      helper: 'Brancher le créateur avancé modulaire des héros avec ses validations et ses sous-blocs.',
      icon: 'settings',
    },
    npc: {
      label: 'PNJ',
      helper: 'Constituer ta réserve de figures récurrentes et de rôles de scène.',
      icon: 'manage_accounts',
    },
    session: {
      label: 'session',
      helper: 'Poser les enjeux, les protagonistes et la scène à jouer.',
      icon: 'event',
    },
  };

  protected readonly entity = computed(() => {
    const key = this.routeParamMap().get('entity') ?? 'session';
    return this.definitions[key] ?? this.definitions['session'];
  });
  protected readonly pageTitle = computed(() =>
    this.placeholderId() ? `Édition ${this.entity().label}` : `Nouvelle ${this.entity().label}`,
  );
}
