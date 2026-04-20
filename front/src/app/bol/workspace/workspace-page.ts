import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../core/auth/auth.service';
import {BolCreaturesService} from '../services/bol-creatures.service';
import {BolDemonsService} from '../services/bol-demons.service';
import {BolHerosService} from '../services/bol-heros.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {WorkspaceHeaderComponent} from './workspace-header/workspace-header';
import {WorkspaceMetric, WorkspaceMetricsComponent} from './workspace-metrics/workspace-metrics';
import {WorkspaceQuickActionsComponent} from './workspace-quick-actions/workspace-quick-actions';

interface SessionPreview {
  readonly title: string;
  readonly campaign: string;
  readonly table: string;
  readonly location: string;
  readonly schedule: string;
  readonly summary: string;
  readonly players: readonly string[];
  readonly beats: readonly { label: string; value: string }[];
}

@Component({
  selector: 'app-workspace-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule,
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
  private readonly creatures = toSignal(this.bolCreaturesService.creatures(), { initialValue: [] });
  private readonly demons = toSignal(this.bolDemonsService.demons(), { initialValue: [] });
  private readonly heroes = toSignal(this.bolHerosService.heroes(), { initialValue: [] });
  private readonly pnjs = toSignal(this.bolHerosService.pnjs(), { initialValue: [] });
  private readonly armes = toSignal(this.bolHerosService.armes(), { initialValue: [] });
  private readonly armures = toSignal(this.bolHerosService.armures(), { initialValue: [] });

  protected readonly userName = computed(() => this.authService.user()?.name ?? 'Utilisateur');
  protected readonly metrics = computed<readonly WorkspaceMetric[]>(() => [
    {
      label: 'Campagnes',
      value: '4',
      detail: '2 arcs actifs et 1 prêt pour la prochaine session.',
      icon: 'pi pi-compass',
      iconClass: 'border border-sky-400/25 bg-sky-400/12 text-sky-300',
    },
    {
      label: 'Héros suivis',
      value: String(this.heroes().length),
      detail: 'Nombre de héros récupéré depuis la bibliothèque Barbarian of Lemuria.',
      icon: 'pi pi-users',
      iconClass: 'border border-emerald-400/25 bg-emerald-400/12 text-emerald-300',
      link: '/library/heroes',
    },
    {
      label: 'Bestiaire',
      value: String(this.creatures().length + this.demons().length),
      detail: 'Créatures et démons disponibles dans le bestiaire Barbarian of Lemuria.',
      icon: 'pi pi-book',
      iconClass: 'border border-amber-400/25 bg-amber-400/12 text-amber-300',
      link: '/library/creatures',
    },
    {
      label: 'PNJ prêts',
      value: String(this.pnjs().length),
      detail: 'Nombre de PNJ récupéré depuis la bibliothèque Barbarian of Lemuria.',
      icon: 'pi pi-user-edit',
      iconClass: 'border border-rose-400/25 bg-rose-400/12 text-rose-300',
      link: '/library/pnjs',
    },
    {
      label: 'Intendance',
      value: String(this.armes().length + this.armures().length),
      detail: 'Entrées d’armes et d’armures disponibles dans la bibliothèque d’intendance.',
      icon: 'pi pi-briefcase',
      iconClass: 'border border-violet-400/25 bg-violet-400/12 text-violet-300',
      link: '/intendance',
    },
  ]);
  protected readonly activeSession: SessionPreview = {
    title: 'Session du soir',
    campaign: 'Les Cités de Bronze',
    table: 'Banquet à la Citadelle',
    location: 'Citadelle d Argos · salle aux lions',
    schedule: 'Ce soir · 20:30',
    summary:
      'La table est prête. Les héros, les factions et les outils narratifs sont alignés pour reprendre immédiatement.',
    players: ['Naïa', 'Malik', 'Ysolde', 'Cassian'],
    beats: [
      { label: 'Scène d ouverture', value: 'Négociation sous tension' },
      { label: 'Enjeu principal', value: 'Conserver le sceau sans guerre ouverte' },
      { label: 'Risque', value: 'Combat diplomatique très probable' },
    ],
  };
  protected logout(): void {
    this.authService.logout();
  }
}
