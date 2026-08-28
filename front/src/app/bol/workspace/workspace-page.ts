import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {AuthService} from '../../core/auth/auth.service';
import {BolCreaturesService} from '../services/bol-creatures.service';
import {BolDemonsService} from '../services/bol-demons.service';
import {BolCatalogService} from '../services/bol-catalog.service';
import {BolFightSessionService} from '../services/bol-fight-session.service';
import {BolHerosService} from '../services/bol-heros.service';
import {BolPnjService} from '../services/bol-pnj.service';
import {BolScenarioService} from '../services/bol-scenario.service';
import {WorkspaceHeaderComponent} from './workspace-header/workspace-header';
import {WorkspaceMetric, WorkspaceMetricsComponent} from './workspace-metrics/workspace-metrics';
import {WorkspaceQuickActionsComponent} from './workspace-quick-actions/workspace-quick-actions';

@Component({
  selector: 'app-workspace-page',
  imports: [
    WorkspaceHeaderComponent,
    WorkspaceMetricsComponent,
    WorkspaceQuickActionsComponent,
  ],
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePageComponent {
  private readonly authService = inject(AuthService);
  private readonly bolCreaturesService = inject(BolCreaturesService);
  private readonly bolDemonsService = inject(BolDemonsService);
  private readonly bolHerosService = inject(BolHerosService);
  private readonly pnjService = inject(BolPnjService);
  private readonly catalogService = inject(BolCatalogService);
  private readonly bolScenarioService = inject(BolScenarioService);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly creatures = toSignal(this.bolCreaturesService.creatures(), { initialValue: [] });
  private readonly demons = toSignal(this.bolDemonsService.demons(), { initialValue: [] });
  private readonly heroes = toSignal(this.bolHerosService.heroes(), { initialValue: [] });
  private readonly pnjs = toSignal(this.pnjService.pnjs(), { initialValue: [] });
  private readonly armes = toSignal(this.catalogService.armes(), { initialValue: [] });
  private readonly armures = toSignal(this.catalogService.armures(), { initialValue: [] });
  private readonly scenariosCount = toSignal(this.bolScenarioService.scenarios(), {initialValue: []});
  private readonly fightSessions = toSignal(this.fightSessionService.fightSessions(), {initialValue: []});

  protected readonly userName = computed(() => this.authService.user()?.name ?? 'Utilisateur');
  protected readonly metrics = computed<readonly WorkspaceMetric[]>(() => [
    {
      label: 'Scénarios',
      value: String(this.scenariosCount().length),
      detail: 'Scénarios préparés pour la table.',
      icon: 'explore',
      color: 'sky',
    },
    {
      label: 'Héros suivis',
      value: String(this.heroes().length),
      detail: 'Nombre de héros récupéré depuis la bibliothèque Barbarian of Lemuria.',
      icon: 'group',
      color: 'emerald',
      link: '/library/heroes',
    },
    {
      label: 'Bestiaire',
      value: String(this.creatures().length + this.demons().length),
      detail: 'Créatures et démons disponibles dans le bestiaire Barbarian of Lemuria.',
      icon: 'menu_book',
      color: 'amber',
      link: '/library/creatures',
    },
    {
      label: 'PNJ prêts',
      value: String(this.pnjs().length),
      detail: 'Nombre de PNJ récupéré depuis la bibliothèque Barbarian of Lemuria.',
      icon: 'manage_accounts',
      color: 'rose',
      link: '/library/pnjs',
    },

    {
      label: 'Intendance',
      value: String(this.armes().length + this.armures().length),
      detail: 'Entrées d’armes et d’armures disponibles dans la bibliothèque d’intendance.',
      icon: 'work',
      color: 'violet',
      link: '/intendance',
    },
    {
      label: 'Combats',
      value: String(this.fightSessions().length),
      detail: 'Combats lancés, à reprendre pour continuer le suivi d’initiative et des PV.',
      icon: 'shield',
      color: 'rose',
      link: '/library/combats',
    },
  ]);
  protected logout(): void {
    this.authService.logout();
  }
}
