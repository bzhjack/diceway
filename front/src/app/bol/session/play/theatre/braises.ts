import {afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, viewChild} from '@angular/core';

const PARTICULES = 46;
/** 30 images par seconde suffisent à des braises ; le mouvement suit le temps écoulé, elles gardent leur vitesse. */
const IMAGE_MS = 1000 / 30;
/** Les vitesses sont données par pas de 1/60 s. */
const PAS_MS = 1000 / 60;
const TEINTES = 4;
const RAYONS = [1, 1.6, 2.2];
const FLOU = 6;

interface Braise {
  x: number;
  y: number;
  vitesse: number;
  phase: number;
  alpha: number;
  /** L'étincelle prédessinée de cette braise (sa teinte et sa taille). */
  sprite: number;
}

/** Une braise neuve, au bas du canvas (ou n'importe où au premier tirage). */
function braise(largeur: number, hauteur: number, partout: boolean): Braise {
  const rayon = 0.6 + Math.random() * 1.6;
  const alpha = 0.3 + Math.random() * 0.6;
  const teinte = Math.min(TEINTES - 1, Math.floor(((alpha - 0.3) / 0.6) * TEINTES));
  const taille = rayon < 1.3 ? 0 : rayon < 1.9 ? 1 : 2;
  return {
    x: Math.random() * largeur,
    y: partout ? Math.random() * hauteur : hauteur + 10,
    vitesse: 0.25 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    alpha,
    sprite: teinte * RAYONS.length + taille,
  };
}

/** Les étincelles prédessinées à la densité de l'écran, halo compris, une par teinte (orange à jaune) et par taille :
 * le flou coûte cher, il est calculé une fois ici et plus à chaque image. `cote` est en pixels CSS. */
function etincelles(cote: number, densite: number): HTMLCanvasElement[] {
  const liste: HTMLCanvasElement[] = [];
  for (let teinte = 0; teinte < TEINTES; teinte++) {
    const alpha = 0.3 + ((teinte + 0.5) * 0.6) / TEINTES;
    for (const rayon of RAYONS) {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = Math.ceil(cote * densite);
      const ctx = sprite.getContext('2d');
      if (ctx) {
        ctx.scale(densite, densite);
        ctx.shadowColor = 'rgba(255, 140, 40, 0.8)';
        ctx.shadowBlur = FLOU * densite;
        ctx.fillStyle = `rgb(255, ${140 + Math.floor(alpha * 60)}, 60)`;
        ctx.beginPath();
        ctx.arc(cote / 2, cote / 2, rayon, 0, Math.PI * 2);
        ctx.fill();
      }
      liste.push(sprite);
    }
  }
  return liste;
}

/** Anime les braises sur le canvas, comme dans la maquette : des étincelles orangées à halo, qui montent en
 * ondulant et s'éteignent avant le haut du plateau. Pour durer des heures de séance sans chauffer : étincelles
 * prédessinées (le halo n'est plus recalculé à chaque image), 30 images par seconde, et seuls les carrés des
 * étincelles de l'image précédente sont effacés, pas tout le canvas ; la densité de l'écran est plafonnée à 1,5 (des
 * lueurs floues n'y perdent rien, et le canvas à recomposer est presque deux fois plus petit qu'en densité 2). Rend la
 * fonction qui arrête tout. Rien ne bouge si l'utilisateur demande moins d'animations ; l'onglet caché suspend le dessin. */
function animerBraises(canvas: HTMLCanvasElement): () => void {
  const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  if (reduit || !ctx) {
    return () => undefined;
  }

  const densite = Math.min(1.5, window.devicePixelRatio || 1);
  const cote = Math.ceil((Math.max(...RAYONS) + FLOU * 2) * 2);
  const sprites = etincelles(cote, densite);
  // Positions et tailles en pixels CSS ; le canvas est à la densité de l'écran.
  let largeur = 0;
  let hauteur = 0;
  let braises: Braise[] = [];
  /** Coins haut-gauche des étincelles dessinées à l'image précédente : seuls ces carrés sont effacés. */
  let dessinees: {x: number; y: number}[] = [];
  const dimensionner = (): void => {
    largeur = canvas.clientWidth;
    hauteur = canvas.clientHeight;
    canvas.width = Math.round(largeur * densite);
    canvas.height = Math.round(hauteur * densite);
    ctx.setTransform(densite, 0, 0, densite, 0, 0);
    braises = Array.from({length: PARTICULES}, () => braise(largeur, hauteur, true));
    dessinees = [];
  };
  const observer = new ResizeObserver(dimensionner);
  observer.observe(canvas);

  let frame = 0;
  let dernier = performance.now();
  const dessiner = (maintenant: number): void => {
    frame = requestAnimationFrame(dessiner);
    if (document.hidden || largeur === 0) {
      dernier = maintenant;
      return;
    }
    if (maintenant - dernier < IMAGE_MS) {
      return;
    }
    const pas = Math.min(4, (maintenant - dernier) / PAS_MS);
    dernier = maintenant;
    for (const coin of dessinees) {
      ctx.clearRect(coin.x - 1, coin.y - 1, cote + 2, cote + 2);
    }
    dessinees = [];
    for (let i = 0; i < braises.length; i++) {
      const b = braises[i];
      b.y -= b.vitesse * pas;
      b.phase += 0.02 * pas;
      b.x += Math.sin(b.phase) * 0.4 * pas;
      // Elles pâlissent dans le haut et renaissent en bas avant d'atteindre le dernier cinquième.
      ctx.globalAlpha = b.alpha * Math.min(1, b.y / (hauteur * 0.75));
      const coin = {x: b.x - cote / 2, y: b.y - cote / 2};
      ctx.drawImage(sprites[b.sprite], coin.x, coin.y, cote, cote);
      dessinees.push(coin);
      if (b.y < hauteur * 0.2) {
        braises[i] = braise(largeur, hauteur, false);
      }
    }
    ctx.globalAlpha = 1;
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
