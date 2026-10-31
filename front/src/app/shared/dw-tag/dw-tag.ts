import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'dw-tag',
  template: `<ng-content />`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--dw-forge-recess);
      color: var(--dw-forge-bronze-text);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.1rem 0.5rem;
      border-radius: var(--dw-radius-pill);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwTagComponent {}
