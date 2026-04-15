import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CardModule } from 'primeng/card';

export interface WorkspaceMetric {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: string;
  readonly iconClass: string;
}

@Component({
  selector: 'app-workspace-metrics',
  imports: [CardModule],
  templateUrl: './workspace-metrics.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceMetricsComponent {
  readonly metric = input.required<WorkspaceMetric>();
}
