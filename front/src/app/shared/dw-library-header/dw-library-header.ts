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
  /** Illustration optionnelle, en fond fixe du haut de la page, qui se fond dans la suie vers le bas, où se lisent les fiches. */
  readonly image = input<string | null>(null);
  /** Une illustration assez haute (800 px et plus) couvre tout l'écran, sous un voile qui fonce vers le bas, au lieu du seul haut de la page. */
  readonly fondPleinePage = input(false);
  /** Une seule ligne fine (titre, compteurs, boutons, sur l'illustration s'il y en a une), sans description : la page garde sa hauteur pour ses fiches. */
  readonly compact = input(false);

  protected readonly backgroundImage = computed(() => {
    const src = this.image();
    if (!src) {
      return null;
    }
    const voile = this.fondPleinePage()
      ? 'linear-gradient(180deg, rgba(15, 10, 6, 0.1) 0%, rgba(15, 10, 6, 0.45) 45%, rgba(15, 10, 6, 0.75) 100%)'
      : 'linear-gradient(180deg, rgba(15, 10, 6, 0.1) 0%, rgba(15, 10, 6, 0.5) 100%)';
    return `${voile}, radial-gradient(70% 42% at 66% 0, rgba(232, 98, 42, 0.16), transparent 70%), url(${src})`;
  });
}
