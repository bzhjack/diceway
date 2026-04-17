import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';

interface CreationDefinition {
  readonly label: string;
  readonly helper: string;
  readonly icon: string;
}

@Component({
  selector: 'app-creation-placeholder-page',
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
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
      icon: 'pi pi-compass',
    },
    table: {
      label: 'table',
      helper: 'Créer une table jouable avant d entrer dans le cockpit de session.',
      icon: 'pi pi-sitemap',
    },
    hero: {
      label: 'Héros',
      helper: 'Ajouter un protagoniste prêt à assigner à une table.',
      icon: 'pi pi-shield',
    },
    'hero-advanced': {
      label: 'Héros avancé',
      helper: 'Brancher le créateur avancé modulaire des héros avec ses validations et ses sous-blocs.',
      icon: 'pi pi-cog',
    },
    npc: {
      label: 'PNJ',
      helper: 'Constituer ta réserve de figures récurrentes et de rôles de scène.',
      icon: 'pi pi-user-edit',
    },
    session: {
      label: 'session',
      helper: 'Poser les enjeux, les protagonistes et la scène à jouer.',
      icon: 'pi pi-calendar-plus',
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
