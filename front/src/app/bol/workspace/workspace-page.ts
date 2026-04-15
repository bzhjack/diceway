import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BolCreaturesService } from '../services/bol-creatures.service';
import { BolDemonsService } from '../services/bol-demons.service';
import { BolHerosService } from '../services/bol-heros.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { WorkspaceHeaderComponent } from './workspace-header/workspace-header';
import { WorkspaceMetric, WorkspaceMetricsComponent } from './workspace-metrics/workspace-metrics';

type TagSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';

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

interface CollectionItem {
  readonly name: string;
  readonly meta: string;
  readonly status: string;
  readonly severity: TagSeverity;
}

interface CollectionCard {
  readonly title: string;
  readonly countLabel: string;
  readonly summary: string;
  readonly icon: string;
  readonly createLabel: string;
  readonly createLink: string;
  readonly accentClass: string;
  readonly items: readonly CollectionItem[];
}

interface QuickAction {
  readonly label: string;
  readonly detail: string;
  readonly icon: string;
  readonly link: string;
  readonly severity: 'primary' | 'secondary';
}

interface ActivityEntry {
  readonly title: string;
  readonly detail: string;
  readonly time: string;
  readonly severity: TagSeverity;
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
      label: 'PJ suivis',
      value: String(this.heroes().length),
      detail: 'Nombre de PJ récupéré depuis la bibliothèque Barbarian of Lemuria.',
      icon: 'pi pi-users',
      iconClass: 'border border-emerald-400/25 bg-emerald-400/12 text-emerald-300',
    },
    {
      label: 'Bestiaire',
      value: String(this.creatures().length + this.demons().length),
      detail: 'Créatures et démons disponibles dans le bestiaire Barbarian of Lemuria.',
      icon: 'pi pi-book',
      iconClass: 'border border-amber-400/25 bg-amber-400/12 text-amber-300',
    },
    {
      label: 'PNJ prêts',
      value: String(this.pnjs().length),
      detail: 'Nombre de PNJ récupéré depuis la bibliothèque Barbarian of Lemuria.',
      icon: 'pi pi-user-edit',
      iconClass: 'border border-rose-400/25 bg-rose-400/12 text-rose-300',
    },
  ]);
  protected readonly activeSession: SessionPreview = {
    title: 'Session du soir',
    campaign: 'Les Cités de Bronze',
    table: 'Banquet à la Citadelle',
    location: 'Citadelle d Argos · salle aux lions',
    schedule: 'Ce soir · 20:30',
    summary:
      'La table est prête. Les PJ, les factions et les outils narratifs sont alignés pour reprendre immédiatement.',
    players: ['Naïa', 'Malik', 'Ysolde', 'Cassian'],
    beats: [
      { label: 'Scène d ouverture', value: 'Négociation sous tension' },
      { label: 'Enjeu principal', value: 'Conserver le sceau sans guerre ouverte' },
      { label: 'Risque', value: 'Combat diplomatique très probable' },
    ],
  };
  protected readonly collections: readonly CollectionCard[] = [
    {
      title: 'Mes campagnes',
      countLabel: '4',
      summary: 'Vue sur les arcs, l état des sessions et les campagnes à relancer.',
      icon: 'pi pi-compass',
      createLabel: 'Créer une campagne',
      createLink: '/create/campaign',
      accentClass: 'from-sky-500/20 to-slate-700',
      items: [
        {
          name: 'Les Cités de Bronze',
          meta: 'Arc III · prochaine session ce soir',
          status: 'Actif',
          severity: 'success',
        },
        {
          name: 'Les Brumes de Varn',
          meta: 'En pause · 2 fils narratifs ouverts',
          status: 'En pause',
          severity: 'warn',
        },
        {
          name: 'La Reine aux Cendres',
          meta: 'Préproduction · bible de campagne',
          status: 'Prépa',
          severity: 'info',
        },
      ],
    },
    {
      title: 'Mes tables',
      countLabel: '3',
      summary: 'Tables prêtes à jouer, organisées autour des sessions à venir.',
      icon: 'pi pi-sitemap',
      createLabel: 'Créer une table',
      createLink: '/create/table',
      accentClass: 'from-orange-500/20 to-slate-700',
      items: [
        {
          name: 'Banquet à la Citadelle',
          meta: '4 joueurs · 1 session live prête',
          status: 'Ce soir',
          severity: 'danger',
        },
        {
          name: 'Poursuite dans les Docks',
          meta: 'Table secondaire · scène d action',
          status: 'Prêt',
          severity: 'success',
        },
        {
          name: 'Audience du Temple Noir',
          meta: 'Encore sans PJ assigné',
          status: 'À compléter',
          severity: 'secondary',
        },
      ],
    },
    {
      title: 'Mes PJ',
      countLabel: '18',
      summary: 'Accès rapide aux fiches, aux archétypes et aux PJ à préparer.',
      icon: 'pi pi-shield',
      createLabel: 'Créer un PJ',
      createLink: '/create/hero',
      accentClass: 'from-emerald-500/20 to-slate-700',
      items: [
        {
          name: 'Naïa Sorel',
          meta: 'Duelliste · Blessée légère',
          status: 'Assignée',
          severity: 'success',
        },
        {
          name: 'Malik Khar',
          meta: 'Mercenaire · Ressources complètes',
          status: 'Assigné',
          severity: 'success',
        },
        {
          name: 'Ysolde de Marne',
          meta: 'Occultiste · poison latent',
          status: 'Alerte',
          severity: 'warn',
        },
      ],
    },
    {
      title: 'Mes PNJ',
      countLabel: '47',
      summary: 'Réserve de figures récurrentes, antagonistes et alliés contextuels.',
      icon: 'pi pi-megaphone',
      createLabel: 'Créer un PNJ',
      createLink: '/create/npc',
      accentClass: 'from-rose-500/20 to-slate-700',
      items: [
        {
          name: 'Veskar le Rouge',
          meta: 'Capitaine du prince exilé',
          status: 'Hostile',
          severity: 'danger',
        },
        {
          name: 'Sélène Avra',
          meta: 'Intendante du palais',
          status: 'Alliée',
          severity: 'success',
        },
        {
          name: 'Garde de galerie',
          meta: 'Archers secondaires pour la scène',
          status: 'Réserve',
          severity: 'info',
        },
      ],
    },
  ];
  protected readonly quickActions: readonly QuickAction[] = [
    {
      label: 'Créer une campagne',
      detail: 'Poser un nouvel arc narratif et ses sessions.',
      icon: 'pi pi-plus-circle',
      link: '/create/campaign',
      severity: 'primary',
    },
    {
      label: 'Créer une session',
      detail: 'Préparer une table jouable et ses enjeux.',
      icon: 'pi pi-calendar-plus',
      link: '/create/session',
      severity: 'primary',
    },
    {
      label: 'Créer un PJ',
      detail: 'Ajouter un protagoniste prêt à assigner.',
      icon: 'pi pi-user-plus',
      link: '/create/hero',
      severity: 'secondary',
    },
    {
      label: 'Créer un PNJ',
      detail: 'Alimenter la réserve d adversaires et alliés.',
      icon: 'pi pi-id-card',
      link: '/create/npc',
      severity: 'secondary',
    },
  ];
  protected readonly activity: readonly ActivityEntry[] = [
    {
      title: 'Banquet à la Citadelle mis à jour',
      detail: 'Le timing fictionnel et les PNJ de scène ont été revus.',
      time: 'Il y a 18 min',
      severity: 'info',
    },
    {
      title: 'Naïa Sorel modifiée',
      detail: 'Vitalité et état blessée synchronisés avant la session.',
      time: 'Il y a 43 min',
      severity: 'warn',
    },
    {
      title: 'Nouvelle campagne en brouillon',
      detail: 'La Reine aux Cendres est prête pour la phase de cadrage.',
      time: 'Hier',
      severity: 'success',
    },
  ];

  protected logout(): void {
    this.authService.logout();
  }
}
