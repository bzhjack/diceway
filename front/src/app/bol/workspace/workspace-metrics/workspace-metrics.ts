import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';

export interface WorkspaceMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: string;
  readonly iconClass: string;
  readonly link?: string;
}

@Component({
  selector: 'bol-workspace-metrics',
  imports: [RouterLink, CardModule],
  templateUrl: './workspace-metrics.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceMetricsComponent {
  readonly metric = input.required<WorkspaceMetric>();
}
