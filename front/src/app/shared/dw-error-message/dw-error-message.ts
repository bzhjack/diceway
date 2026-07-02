import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector: 'dw-error-message',
  template: `
    @if (messages().length > 0) {
      <div class="dw-error-message" role="alert">
        @for (message of messages(); track message) {
          <p>{{ message }}</p>
        }
      </div>
    }
  `,
  styles: [`
    .dw-error-message {
      margin: 4px 0 12px;
      padding: 10px 12px;
      border: 1px solid rgba(248, 113, 113, 0.28);
      border-radius: 8px;
      background: rgba(248, 113, 113, 0.1);
      color: var(--dw-color-echec);
      font-size: 0.875rem;

      p {
        margin: 0;

        & + p {
          margin-top: 4px;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwErrorMessageComponent {
  messages = input<string[]>([]);
}
