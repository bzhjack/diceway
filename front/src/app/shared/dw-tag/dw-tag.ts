import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'dw-tag',
  template: `<ng-content />`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--p-tag-contrast-background);
      color: var(--p-tag-contrast-color);
      font-size: var(--p-tag-font-size);
      font-weight: var(--p-tag-font-weight);
      padding: var(--p-tag-padding);
      border-radius: var(--p-tag-border-radius);
      gap: var(--p-tag-gap);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwTagComponent {}
