import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';

@Component({
  selector: 'bol-workspace-header',
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  templateUrl: './workspace-header.html',
  styleUrl: './workspace-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceHeaderComponent {
  readonly userName = input.required<string>();
  readonly logoutRequested = output<void>();

  protected requestLogout(): void {
    this.logoutRequested.emit();
  }
}
