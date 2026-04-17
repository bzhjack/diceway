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
      state: { returnUrl: '/' },
      severity: 'secondary',
    },
    {
      label: 'Créer une créature',
      detail: 'Alimenter le bestiaire avec un nouveau profil de scène.',
      icon: 'pi pi-book',
      link: '/create/creature',
      state: { returnUrl: '/' },
      severity: 'secondary',
    },
    {
      label: 'Créer un démon',
      detail: 'Préparer une entité infernale prête pour la scène ou l aventure.',
      icon: 'pi pi-bolt',
      link: '/create/demon',
      state: { returnUrl: '/' },
      severity: 'secondary',
    },
    {
      label: 'Créer un PNJ',
      detail: 'Alimenter la réserve d adversaires et alliés.',
      icon: 'pi pi-id-card',
      link: '/create/pnj',
      state: { returnUrl: '/' },
      severity: 'secondary',
    },
  ];
}
