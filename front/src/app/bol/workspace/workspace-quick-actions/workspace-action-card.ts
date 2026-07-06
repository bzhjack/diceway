import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'bol-workspace-action-card',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="wac-card p-2.5">
      <div class="flex items-start gap-2.5">
        <div class="wac-icon mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center">
          <mat-icon>{{ icon() }}</mat-icon>
        </div>
        <div class="flex-1 space-y-2">
          <div class="space-y-1">
            <p class="wac-label m-0">{{ label() }}</p>
            <p class="wac-detail m-0">{{ detail() }}</p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button mat-stroked-button size="small" [routerLink]="link()" [state]="state()">
              <mat-icon>open_in_new</mat-icon> Ouvrir
            </button>
            @if (advancedLink()) {
              <button mat-stroked-button size="small" [routerLink]="advancedLink()" [state]="advancedState()">
                <mat-icon>settings</mat-icon> Avancé
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wac-card {
      border: 1px solid var(--dw-border);
      background: rgba(45, 55, 72, 0.7);
    }

    .wac-icon {
      border: 1px solid var(--dw-border);
      background: #334155;
      font-size: 0.875rem;
      color: var(--dw-surface-800);
    }

    .wac-label {
      font-size: 0.875rem;
      font-weight: 700;
      line-height: 1.25rem;
      color: var(--dw-surface-800);
    }

    .wac-detail {
      font-size: 0.75rem;
      line-height: 1.25rem;
      color: var(--dw-surface-600);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceActionCardComponent {
  readonly label = input.required<string>();
  readonly detail = input.required<string>();
  readonly icon = input.required<string>();
  readonly link = input.required<string>();
  readonly state = input<Record<string, string>>();
  readonly advancedLink = input<string>();
  readonly advancedState = input<Record<string, string>>();
}
