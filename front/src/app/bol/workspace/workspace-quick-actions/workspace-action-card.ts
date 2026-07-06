import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'bol-workspace-action-card',
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="border border-[#424b57] bg-[#2d3748]/70 p-2.5">
      <div class="flex items-start gap-2.5">
        <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-[#424b57] bg-[#334155] text-sm text-slate-100">
          <i [class]="icon()" aria-hidden="true"></i>
        </div>
        <div class="flex-1 space-y-2">
          <div class="space-y-1">
            <p class="m-0 text-sm font-bold leading-5 text-slate-100">{{ label() }}</p>
            <p class="m-0 text-xs leading-5 text-slate-300">{{ detail() }}</p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button mat-stroked-button size="small" [routerLink]="link()" [state]="state()">
              <i class="pi pi-arrow-up-right"></i> Ouvrir
            </button>
            @if (advancedLink()) {
              <button mat-stroked-button size="small" [routerLink]="advancedLink()" [state]="advancedState()">
                <i class="pi pi-cog"></i> Avancé
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `,
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
