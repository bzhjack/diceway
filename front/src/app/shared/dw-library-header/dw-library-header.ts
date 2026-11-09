import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';

@Component({
  selector: 'dw-library-header',
  imports: [MatCard, MatCardContent],
  templateUrl: './dw-library-header.html',
  styleUrl: './dw-library-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwLibraryHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  /** Illustration optionnelle, posée en fond de toute la page (fixe) sous un voile de suie qui fonce vers le bas, où se lisent les fiches. */
  readonly image = input<string | null>(null);
  /** Une seule ligne fine (titre, compteurs, boutons, sur l'illustration s'il y en a une), sans description : la page garde sa hauteur pour ses fiches. */
  readonly compact = input(false);

  protected readonly backgroundImage = computed(() => {
    const src = this.image();
    return src
      ? `linear-gradient(180deg, rgba(15, 10, 6, 0.1) 0%, rgba(15, 10, 6, 0.45) 45%, rgba(15, 10, 6, 0.75) 100%), ` +
        `radial-gradient(70% 42% at 66% 0, rgba(232, 98, 42, 0.16), transparent 70%), ` +
        `url(${src})`
      : null;
  });
}
