import {RouterLink} from '@angular/router';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

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
  imports: [RouterLink, MatIconModule, MatCard, MatCardContent],
  templateUrl: './workspace-metrics.html',
  styleUrl: './workspace-metrics.scss',
  host: {class: 'block h-full'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceMetricsComponent {
  readonly metric = input.required<WorkspaceMetric>();
}
