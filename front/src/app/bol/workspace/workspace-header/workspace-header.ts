import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';

@Component({
  selector: 'bol-workspace-header',
  imports: [MatButtonModule, MatCard, MatCardContent, DwTagComponent],
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
