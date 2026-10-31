import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

/** L'en-tête d'une page de fiche : son icône, son surtitre, son titre, une note éventuelle sous le titre (`dwFormHeaderNote`), et à droite ses boutons (contenu projeté). */
@Component({
  selector: 'dw-form-header',
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div class="flex items-center gap-3">
        <div class="dw-fh-icon">
          <mat-icon [svgIcon]="icon()" />
        </div>
        <div class="space-y-1">
          <p class="dw-fh-eyebrow">{{ eyebrow() }}</p>
          <h1 class="dw-fh-title">{{ title() }}</h1>
          <ng-content select="[dwFormHeaderNote]" />
        </div>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row md:justify-end">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './dw-form-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwFormHeaderComponent {
  readonly icon = input.required<string>();
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
}
