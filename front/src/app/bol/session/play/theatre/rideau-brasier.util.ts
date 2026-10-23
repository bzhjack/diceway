import {RideauBraises, RideauBrulure} from '../../models/theatre.model';

/** Bruit de valeurs lissé : une grille aléatoire dont les cases font `cell` pixels, interpolée entre ses nœuds. */
function bruit(largeur: number, hauteur: number, cell: number): Float32Array {
  const gw = Math.ceil(largeur / cell) + 2;
  const grille = new Float32Array(gw * (Math.ceil(hauteur / cell) + 2)).map(() => Math.random());
  const sortie = new Float32Array(largeur * hauteur);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const fx = x / cell;
      const fy = y / cell;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = (fx - ix) ** 2 * (3 - 2 * (fx - ix));
      const ty = (fy - iy) ** 2 * (3 - 2 * (fy - iy));
      const a = grille[iy * gw + ix];
      const b = grille[iy * gw + ix + 1];
      const c = grille[(iy + 1) * gw + ix];
      const d = grille[(iy + 1) * gw + ix + 1];
      sortie[y * largeur + x] = a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    }
  }
  return sortie;
}

/** L'ordre de combustion : le bas de la scène brûle d'abord, un bruit à trois échelles déchire le front de flamme. */
export function champDeBrulure(largeur: number, hauteur: number): Float32Array {
  const n1 = bruit(largeur, hauteur, 76);
  const n2 = bruit(largeur, hauteur, 26);
  const n3 = bruit(largeur, hauteur, 9);
  const champ = new Float32Array(largeur * hauteur);
  for (let y = 0; y < hauteur; y++) {
    for (let x = 0; x < largeur; x++) {
      const i = y * largeur + x;
      champ[i] = (1 - y / (hauteur - 1)) * 0.62 + (n1[i] * 0.55 + n2[i] * 0.3 + n3[i] * 0.15) * 0.38;
    }
  }
  return champ;
}

/** Peint la brûlure à l'avancement `seuil` : ce qui est derrière le front est charbon, le front est en flammes, et juste
 * devant lui l'image roussit. */
export function peindreBrulure(b: RideauBrulure, seuil: number): void {
  const d = b.image.data;
  const large = 0.075;
  const roussi = 0.04;
  for (let i = 0; i < b.champ.length; i++) {
    const v = seuil - b.champ[i];
    const o = i * 4;
    if (v <= -roussi) {
      d[o + 3] = 0;
    } else if (v <= 0) {
      d[o] = 46;
      d[o + 1] = 20;
      d[o + 2] = 8;
      d[o + 3] = ((v + roussi) / roussi) * 170;
    } else if (v < large) {
      const k = v / large;
      let r: number, g: number, bl: number;
      if (k < 0.25) {
        const s = k / 0.25;
        [r, g, bl] = [255, 238 - 96 * s, 175 - 135 * s];
      } else if (k < 0.6) {
        const s = (k - 0.25) / 0.35;
        [r, g, bl] = [255 - 85 * s, 142 - 102 * s, 40 - 28 * s];
      } else {
        const s = (k - 0.6) / 0.4;
        [r, g, bl] = [170 - 158 * s, 40 - 33 * s, 12 - 7 * s];
      }
      d[o] = r;
      d[o + 1] = g;
      d[o + 2] = bl;
      d[o + 3] = 255;
    } else {
      d[o] = 12;
      d[o + 1] = 7;
      d[o + 2] = 5;
      d[o + 3] = 255;
    }
  }
  b.flamme.putImageData(b.image, 0, 0);
  b.lueur.clearRect(0, 0, b.largeur, b.hauteur);
  b.lueur.drawImage(b.flamme.canvas, 0, 0);
}

const entre = (min: number, max: number): number => min + Math.random() * (max - min);

/** Lance les braises sur un canvas aux dimensions de l'écran (en pixels CSS). Elles naissent sur la ligne de feu et
 * montent en dérivant ; `stop()` arrête la boucle et efface le canvas. */
export function lancerBraises(canvas: HTMLCanvasElement, largeur: number, hauteur: number): RideauBraises {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(largeur * dpr);
  canvas.height = Math.round(hauteur * dpr);
  const c = canvas.getContext('2d');
  let actif = true;
  const braises = {front: 1.05, rate: 150, alpha: 1, stop: () => (actif = false)};
  if (!c) {
    return braises;
  }
  c.scale(dpr, dpr);
  const ps: {x: number; y: number; vx: number; vy: number; vie: number; max: number; r: number; teinte: number}[] = [];
  let dernier = performance.now();
  const image = (now: number): void => {
    if (!actif) {
      c.clearRect(0, 0, largeur, hauteur);
      return;
    }
    const dt = Math.min(0.05, (now - dernier) / 1000);
    dernier = now;
    for (let k = 0; k < braises.rate * dt; k++) {
      const y = Math.min(hauteur, Math.max(0, braises.front * hauteur + entre(-0.06, 0.06) * hauteur));
      ps.push({x: Math.random() * largeur, y, vx: entre(-15, 15), vy: -entre(40, 150), vie: 0, max: entre(1, 2.6), r: entre(0.7, 2.2), teinte: Math.floor(entre(150, 230))});
    }
    c.clearRect(0, 0, largeur, hauteur);
    c.globalCompositeOperation = 'lighter';
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.vie += dt;
      if (p.vie > p.max) {
        ps.splice(i, 1);
        continue;
      }
      p.x += (p.vx + Math.sin(now / 280 + i) * 18) * dt;
      p.y += p.vy * dt;
      c.fillStyle = `rgba(255,${p.teinte},70,${(1 - p.vie / p.max) * braises.alpha})`;
      c.beginPath();
      c.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
      c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
  return braises;
}

/** Anime `fn(t)` de 0 à 1 sur `ms` millisecondes (t suit `easing`) ; s'arrête sans bruit dès que `annule()` est vrai. */
export function animer(ms: number, fn: (t: number) => void, easing: (t: number) => number, annule: () => boolean): Promise<void> {
  return new Promise((fini) => {
    const debut = performance.now();
    const image = (now: number): void => {
      if (annule()) {
        fini();
        return;
      }
      const t = Math.min(1, (now - debut) / ms);
      fn(easing(t));
      if (t < 1) {
        requestAnimationFrame(image);
      } else {
        fini();
      }
    };
    requestAnimationFrame(image);
  });
}

export const EASE = {lineaire: (t: number): number => t, sortie: (t: number): number => 1 - (1 - t) ** 3};
