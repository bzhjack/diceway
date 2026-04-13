import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-workspace-page',
  templateUrl: './workspace-page.html',
  styleUrl: './workspace-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePageComponent {
  private readonly authService = inject(AuthService);

  protected readonly userName = computed(() => this.authService.user()?.name ?? 'Utilisateur');

  protected logout(): void {
    this.authService.logout();
  }
}
