import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type DiceBox from '@3d-dice/dice-box';
import type { DiceBoxRollResult } from '@3d-dice/dice-box';

let nextDiceHostId = 0;

@Component({
  selector: 'app-dice-box-host',
  templateUrl: './dice-box-host.html',
  styleUrl: './dice-box-host.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DiceBoxHostComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly surfaceRef = viewChild.required<ElementRef<HTMLDivElement>>('surface');
  private readonly hostId = `dw-dice-box-host-${++nextDiceHostId}`;

  /** Taille des dés relative au conteneur — plage usuelle de dice-box : 2 (petit) à 10 (grand). */
  readonly scale = input(8);

  /** Couleur des dés (hex) — même bleu partout par défaut, personnalisable par dialog. */
  readonly themeColor = input('#d9a441');

  /** Thème (dossier sous `assets/dice-box/themes/`) — matériau/mesh des dés, personnalisable par dialog. */
  readonly theme = input('default');

  private box: DiceBox | null = null;
  private initPromise: Promise<void> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  protected readonly ready = signal(false);
  protected readonly failed = signal(false);

  constructor() {
    afterNextRender(() => {
      void this.ensureReady();
    });

    this.destroyRef.onDestroy(() => {
      this.resetHost();
    });
  }

  async clear(): Promise<void> {
    await this.ensureReady();
    this.box?.clear();
  }

  async rollNotation(notation: string): Promise<DiceBoxRollResult[]> {
    await this.ensureReady();

    if (!this.box) {
      throw new Error('Dice box is not available');
    }

    return this.box.roll(notation);
  }

  private async ensureReady(): Promise<void> {
    if (this.box) {
      return;
    }

    if (!this.initPromise) {
      this.initPromise = this.initBox();
    }

    await this.initPromise;
  }

  private async initBox(): Promise<void> {
    const surface = this.surfaceRef().nativeElement;
    surface.replaceChildren();
    surface.id = this.hostId;

    try {
      const {default: DiceBox} = await import('@3d-dice/dice-box');
      const box = new DiceBox({
        container: `#${this.hostId}`,
        assetPath: '/assets/dice-box/',
        theme: this.theme(),
        offscreen: true,
        scale: this.scale(),
        themeColor: this.themeColor(),
        id: `${this.hostId}-canvas`,
      });

      await box.init();

      this.watchSize(surface);
      this.box = box;
      this.ready.set(true);
      this.failed.set(false);
    } catch (error) {
      console.error('Dice box initialization failed', error);
      this.failed.set(true);
      this.initPromise = null;
    }
  }

  /** dice-box ne recalcule sa zone de jeu (murs, caméra, canvas) que sur un `resize` de la fenêtre. Quand le
   * conteneur change de taille tout seul — le panneau de jet grandit après un échec, par exemple — les dés
   * sont étirés et rebondissent sur des murs qui ne correspondent plus : on lui rejoue donc cet événement. */
  private watchSize(surface: HTMLElement): void {
    let width = surface.clientWidth;
    let height = surface.clientHeight;
    let frame = 0;
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver(() => {
      if (surface.clientWidth === width && surface.clientHeight === height) {
        return;
      }
      width = surface.clientWidth;
      height = surface.clientHeight;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    });
    this.resizeObserver.observe(surface);
  }

  private resetHost(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.box?.clear();
    this.box = null;
    this.initPromise = null;

    const surface = document.getElementById(this.hostId);
    surface?.replaceChildren();
  }
}
