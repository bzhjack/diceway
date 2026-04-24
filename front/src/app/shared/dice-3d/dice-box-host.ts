import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
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

  private box: DiceBox | null = null;
  private initPromise: Promise<void> | null = null;

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
        theme: 'default',
        offscreen: true,
        scale: 8,
        themeColor: '#60a5fa',
        id: `${this.hostId}-canvas`,
      });

      await box.init();

      this.box = box;
      this.ready.set(true);
      this.failed.set(false);
    } catch (error) {
      console.error('Dice box initialization failed', error);
      this.failed.set(true);
      this.initPromise = null;
    }
  }

  private resetHost(): void {
    this.box?.clear();
    this.box = null;
    this.initPromise = null;

    const surface = document.getElementById(this.hostId);
    surface?.replaceChildren();
  }
}
