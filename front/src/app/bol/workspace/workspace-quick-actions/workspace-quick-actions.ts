import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {WorkspaceActionCardComponent} from './workspace-action-card';

interface WorkspaceQuickAction {
  readonly label: string;
  readonly detail: string;
  readonly icon: string;
  readonly link: string;
  readonly state?: Record<string, string>;
  readonly advancedLink?: string;
  readonly advancedState?: Record<string, string>;
  readonly severity: 'primary' | 'secondary';
}

const STATIC_ACTIONS: readonly WorkspaceQuickAction[] = [
  {
    label: 'Créer un héros',
    detail: 'Ajouter un héros jouable prêt pour la table.',
    icon: 'person_add',
    link: '/create/hero',
    state: {returnUrl: '/'},
    advancedLink: '/create/hero-advanced',
    advancedState: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Créer une créature',
    detail: 'Ajouter une créature au bestiaire de scène.',
    icon: 'menu_book',
    link: '/create/creature',
    state: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Créer un démon',
    detail: 'Préparer un démon pour la scène ou l’intrigue.',
    icon: 'bolt',
    link: '/create/demon',
    state: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Créer un PNJ',
    detail: 'Ajouter un PNJ à la réserve de jeu.',
    icon: 'badge',
    link: '/create/pnj',
    state: {returnUrl: '/'},
    severity: 'secondary',
  },
  {
    label: 'Bibliothèque d’intendance',
    detail: 'Ouvrir les référentiels armes, armures.',
    icon: 'work',
    link: '/intendance',
    severity: 'secondary',
  },
];

@Component({
  selector: 'bol-workspace-quick-actions',
  imports: [MatCard, MatCardContent, WorkspaceActionCardComponent],
  templateUrl: './workspace-quick-actions.html',
  styleUrl: './workspace-quick-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceQuickActionsComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly sessions = refreshableResource(() => this.fightSessionService.fightSessions());

  /** Session non close la plus récente (les sessions sont déjà triées par date décroissante côté backend). */
  private readonly openSession = computed(() =>
    this.sessions.data().find((s) => s.statut === 'libre' || s.statut === 'combat'),
  );

  /** Session ouverte : deux cartes (reprendre + nouvelle) puisque rien ne clôt jamais une session « libre »/« combat » côté app.
   *  Aucune session ouverte : une seule carte « Nouvelle session », en primaire. */
  private readonly sessionActions = computed<readonly WorkspaceQuickAction[]>(() => {
    const open = this.openSession();
    if (!open?.id) {
      return [
        {
          label: 'Nouvelle session',
          detail: 'Ouvrir une session avec les héros présents à table.',
          icon: 'groups',
          link: '/session/new',
          severity: 'primary',
        },
      ];
    }

    return [
      {
        label: 'Reprendre la session',
        detail: open.titre ?? 'Continuer la session en cours.',
        icon: 'groups',
        link: `/session/${open.id}/play`,
        severity: 'primary',
      },
      {
        label: 'Nouvelle session',
        detail: 'Ouvrir une session avec les héros présents à table.',
        icon: 'groups',
        link: '/session/new',
        severity: 'secondary',
      },
    ];
  });

  protected readonly quickActions = computed<readonly WorkspaceQuickAction[]>(() => [
    ...this.sessionActions(),
    ...STATIC_ACTIONS,
  ]);
}
