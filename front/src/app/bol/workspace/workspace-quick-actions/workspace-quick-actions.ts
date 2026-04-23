import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';

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

@Component({
  selector: 'bol-workspace-quick-actions',
  imports: [RouterLink, ButtonModule, CardModule],
  templateUrl: './workspace-quick-actions.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceQuickActionsComponent {
  protected readonly quickActions: readonly WorkspaceQuickAction[] = [
    {
      label: 'Créer un scénario',
      detail: "Préparer l'accroche et les PJ pour une session.",
      icon: 'pi pi-compass',
      link: '/create/scenario',
      state: {returnUrl: '/'},
      severity: 'secondary',
    },
    {
      label: 'Créer un héros',
      detail: 'Ajouter un héros jouable prêt pour la table.',
      icon: 'pi pi-user-plus',
      link: '/create/hero',
      state: { returnUrl: '/' },
      advancedLink: '/create/hero-advanced',
      advancedState: { returnUrl: '/' },
      severity: 'secondary',
    },
    {
      label: 'Créer une créature',
      detail: 'Ajouter une créature au bestiaire de scène.',
      icon: 'pi pi-book',
      link: '/create/creature',
      state: { returnUrl: '/' },
      severity: 'secondary',
    },
    {
      label: 'Créer un démon',
      detail: 'Préparer un démon pour la scène ou l intrigue.',
      icon: 'pi pi-bolt',
      link: '/create/demon',
      state: { returnUrl: '/' },
      severity: 'secondary',
    },
    {
      label: 'Créer un PNJ',
      detail: 'Ajouter un PNJ à la réserve de jeu.',
      icon: 'pi pi-id-card',
      link: '/create/pnj',
      state: { returnUrl: '/' },
      severity: 'secondary',
    },
    {
      label: 'Bibliothèque d’intendance',
      detail: 'Ouvrir les référentiels armes, armures.',
      icon: 'pi pi-briefcase',
      link: '/intendance',
      severity: 'secondary',
    },
  ];
}
