import {afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, viewChild} from '@angular/core';

const PARTICULES = 46;

interface Braise {
  x: number;
  y: number;
  rayon: number;
  vitesse: number;
  phase: number;
  alpha: number;
}

/** Une braise neuve, au bas du canvas (ou n'importe où au premier tirage). Les mesures sont en pixels du canvas. */
function braise(largeur: number, hauteur: number, ratio: number, partout: boolean): Braise {
  return {
    x: Math.random() * largeur,
    y: partout ? Math.random() * hauteur : hauteur + 10,
    rayon: (0.6 + Math.random() * 1.6) * ratio,
    vitesse: (0.25 + Math.random() * 0.6) * ratio,
    phase: Math.random() * Math.PI * 2,
    alpha: 0.3 + Math.random() * 0.6,
  };
}

/** Anime les braises sur le canvas, comme dans la maquette : des étincelles orangées à halo, qui montent en
 * ondulant et s'éteignent avant le haut du plateau. Rend la fonction qui arrête tout. Rien ne bouge si
 * l'utilisateur demande moins d'animations ; l'onglet caché suspend le dessin. */
function animerBraises(canvas: HTMLCanvasElement): () => void {
  const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduit || !ctx) {
    return () => undefined;
  }

  let largeur = 0;
  let hauteur = 0;
  let ratio = 1;
  let braises: Braise[] = [];
  const dimensionner = (): void => {
    ratio = window.devicePixelRatio || 1;
    largeur = canvas.width = Math.round(canvas.clientWidth * ratio);
    hauteur = canvas.height = Math.round(canvas.clientHeight * ratio);
    braises = Array.from({length: PARTICULES}, () => braise(largeur, hauteur, ratio, true));
  };
  const observer = new ResizeObserver(dimensionner);
  observer.observe(canvas);

  let frame = 0;
  const dessiner = (): void => {
    frame = requestAnimationFrame(dessiner);
    if (document.hidden || largeur === 0) {
      return;
    }
    ctx.clearRect(0, 0, largeur, hauteur);
    ctx.shadowColor = 'rgba(255, 140, 40, 0.8)';
    ctx.shadowBlur = 6 * ratio;
    for (let i = 0; i < braises.length; i++) {
      const b = braises[i];
      b.y -= b.vitesse;
      b.phase += 0.02;
      b.x += Math.sin(b.phase) * 0.4 * ratio;
      // Elles pâlissent dans le haut et renaissent en bas avant d'atteindre le dernier cinquième.
      const fondu = Math.min(1, b.y / (hauteur * 0.75));
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, ${140 + Math.floor(b.alpha * 60)}, 60, ${b.alpha * fondu})`;
      ctx.arc(b.x, b.y, b.rayon, 0, Math.PI * 2);
      ctx.fill();
      if (b.y < hauteur * 0.2) {
        braises[i] = braise(largeur, hauteur, ratio, false);
      }
    }
  };
  frame = requestAnimationFrame(dessiner);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}

/** Des braises qui montent du bas du plateau, sous le texte. Purement décoratif. */
@Component({
  selector: 'bol-braises',
  template: `<canvas #canvas class="brs"></canvas>`,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .brs {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'aria-hidden': 'true'},
})
export class BraisesComponent {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const arreter = animerBraises(this.canvas().nativeElement);
      destroyRef.onDestroy(arreter);
    });
  }
}
