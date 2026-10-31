import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

/** Le portrait d'une fiche : un bouton qui le montre et demande à le changer. */
@Component({
  selector: 'dw-avatar-picker',
  imports: [MatIconModule],
  template: `
    <button type="button" class="dw-ap" [attr.aria-label]="label()" (click)="picked.emit()">
      @if (src(); as portrait) {
        <img [src]="portrait" alt="" class="h-full w-full object-cover" />
      } @else {
        <span class="dw-ap-placeholder">
          <mat-icon class="!text-3xl">image</mat-icon>
          <span class="dw-ap-hint">Cliquer pour modifier</span>
        </span>
      }

      <span class="dw-ap-overlay">
        <span class="dw-ap-overlay-label">Modifier</span>
      </span>
    </button>
  `,
  styleUrl: './dw-avatar-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwAvatarPickerComponent {
  readonly src = input<string | null>(null);
  /** Le nom du bouton pour un lecteur d'écran, par exemple « Changer le portrait du héros ». */
  readonly label = input.required<string>();

  readonly picked = output<void>();
}
