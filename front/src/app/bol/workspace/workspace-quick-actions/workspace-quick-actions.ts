import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
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

@Component({
  selector: 'bol-workspace-quick-actions',
  imports: [MatCard, MatCardContent, WorkspaceActionCardComponent],
  templateUrl: './workspace-quick-actions.html',
  styleUrl: './workspace-quick-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceQuickActionsComponent {
  protected readonly quickActions: readonly WorkspaceQuickAction[] = [
    {
      label: 'Nouveau combat',
      detail: 'Choisir les combattants (héros, PNJ, créatures, démons) pour préparer une rencontre.',
      icon: 'shield',
      link: '/combat/new',
      severity: 'secondary',
    },
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
}
