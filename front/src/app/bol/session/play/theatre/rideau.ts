import {ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, signal, untracked, viewChild} from '@angular/core';
import {RideauBraises, RideauBrulure, RideauEtat, SceneCarton} from '../../models/theatre.model';
import {animer, champDeBrulure, EASE, lancerBraises, peindreBrulure} from './rideau-brasier.util';
import {CARTON_RYTHME} from './theatre.util';

/** Largeur, en pixels, du calque de brûlure : peu, la flamme est étirée à l'écran et reste douce. */
const BRULURE_LARGEUR = 520;
/** Le titre s'efface un instant avant que la brûlure ne se lève. */
const TITRE_EFFACE_MS = 300;
/** La brûlure se lève, et la fumée avec elle, sur la nouvelle scène. */
const OUVERTURE_MS = 1700;

const attendre = (ms: number): Promise<void> => new Promise((fini) => setTimeout(fini, ms));

/** Le rideau du plateau, en brasier : pendant un changement de scène, la scène brûle du bas vers le haut sous des
 * braises, le titre de la scène qui arrive sort de la forge, puis la brûlure se lève dans la fumée sur la nouvelle
 * scène. Le store garde le rideau fermé jusqu'à la fin du titre (`cartonTenue`). Purement décoratif (`aria-hidden`) : le
 * cartouche annonce la nouvelle scène. */
@Component({
  selector: 'bol-rideau',
  template: `
    <div #fumee class="rdo-fumee"></div>
    <canvas #flamme class="rdo-flamme"></canvas>
    <canvas #lueur class="rdo-lueur"></canvas>
    <canvas #braises class="rdo-braises"></canvas>
    @if (carton(); as carton) {
      <p class="rdo-titre" [class.rdo-titre--visible]="titreVisible()"><span>{{ carton.titre }}</span></p>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      overflow: hidden;
      pointer-events: none;
    }

    :host(.rdo--ferme) {
      pointer-events: auto;
    }

    canvas,
    .rdo-fumee {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
    }

    .rdo-fumee {
      z-index: 1;
      inset: -15%;
      width: auto;
      height: auto;
      background:
        radial-gradient(40% 35% at 25% 75%, rgba(78, 66, 56, 0.95), transparent 70%),
        radial-gradient(45% 40% at 70% 65%, rgba(64, 56, 50, 0.95), transparent 70%),
        radial-gradient(50% 45% at 50% 35%, rgba(52, 46, 42, 0.9), transparent 70%),
        radial-gradient(35% 30% at 85% 25%, rgba(70, 62, 56, 0.85), transparent 70%),
        rgba(28, 24, 21, 0.85);
      filter: blur(18px);
    }

    .rdo-flamme {
      z-index: 2;
    }

    .rdo-lueur {
      z-index: 3;
      filter: blur(10px) brightness(1.5);
      mix-blend-mode: screen;
    }

    .rdo-braises {
      z-index: 5;
    }

    // Le titre sort de la forge : trop chaud et flou, il se pose en refroidissant.
    .rdo-titre {
      position: relative;
      z-index: 4;
      margin: 0;
      padding: 0 2rem;
      max-width: 52rem;
      font-family: 'Muse Display Harmony', serif;
      font-size: clamp(2rem, 5vw, 3.8rem);
      line-height: 1.05;
      text-align: center;
      text-wrap: balance;

      span {
        display: inline-block;
        background: linear-gradient(180deg, #fff3c8 0%, #f2bb52 48%, #9a5412 100%);
        background-clip: text;
        color: transparent;
        opacity: 0;
        transform: scale(1.06);
        filter: brightness(2.6) blur(5px) drop-shadow(0 0 18px rgba(255, 140, 40, 0.6));
        transition:
          opacity 0.7s ease,
          transform 1s ease,
          filter 1s ease;
      }
    }

    .rdo-titre--visible span {
      opacity: 1;
      transform: none;
      filter: brightness(1) blur(0) drop-shadow(0 0 16px rgba(255, 120, 30, 0.45));
    }

    // Le titre s'éteint plus vite qu'il n'est apparu.
    :host(:not(.rdo--ferme)) .rdo-titre span {
      transition-duration: 0.35s;
    }

    // Moins d'animations : le noir tombe et se lève d'un coup, le titre s'affiche en entier.
    @media (prefers-reduced-motion: reduce) {
      .rdo-titre span,
      :host(:not(.rdo--ferme)) .rdo-titre span {
        transition: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.rdo--ferme]': "etat() === 'ferme'",
  },
})
export class RideauComponent {
  readonly etat = input.required<RideauEtat>();
  readonly carton = input<SceneCarton | null>(null);

  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fumee = viewChild.required<ElementRef<HTMLElement>>('fumee');
  private readonly flamme = viewChild.required<ElementRef<HTMLCanvasElement>>('flamme');
  private readonly lueur = viewChild.required<ElementRef<HTMLCanvasElement>>('lueur');
  private readonly braises = viewChild.required<ElementRef<HTMLCanvasElement>>('braises');

  protected readonly titreVisible = signal(false);

  private feu: RideauBraises | null = null;
  /** Le rideau s'est fermé au moins une fois : seule sa réouverture a quelque chose à lever. */
  private brule = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.feu?.stop());
    // Chaque changement d'état relance l'animation de zéro ; si l'état change en cours de route, `annule` arrête l'ancienne.
    effect((onCleanup) => {
      const etat = this.etat();
      let annule = false;
      onCleanup(() => (annule = true));
      untracked(() => {
        if (etat === 'ferme') {
          void this.fermer(() => annule);
        } else if (this.brule) {
          void this.ouvrir(() => annule);
        }
      });
    });
  }

  private reduit(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /** La scène brûle de bas en haut (`CARTON_RYTHME.fondu`), puis le titre sort de la forge. */
  private async fermer(annule: () => boolean): Promise<void> {
    this.brule = true;
    this.feu?.stop();
    this.titreVisible.set(false);
    const brulure = this.preparer();
    const flamme = this.flamme().nativeElement;
    const lueur = this.lueur().nativeElement;
    this.fumee().nativeElement.style.opacity = '0';
    flamme.style.opacity = '1';
    lueur.style.opacity = '0.8';
    if (!brulure || this.reduit()) {
      if (brulure) {
        peindreBrulure(brulure, 2);
      }
      this.titreVisible.set(true);
      return;
    }
    const feu = lancerBraises(this.braises().nativeElement, this.hote.nativeElement.clientWidth, this.hote.nativeElement.clientHeight);
    this.feu = feu;
    this.braises().nativeElement.style.opacity = '1';
    await animer(
      CARTON_RYTHME.fondu,
      (t) => {
        const seuil = -0.08 + t * 1.2;
        peindreBrulure(brulure, seuil);
        feu.front = 1 - (seuil - 0.12) / 0.62;
      },
      EASE.lineaire,
      annule,
    );
    if (annule()) {
      return;
    }
    peindreBrulure(brulure, 2);
    feu.front = 1;
    feu.rate = 55;
    await attendre(30);
    if (!annule()) {
      this.titreVisible.set(true);
    }
  }

  /** Le titre s'éteint, puis la brûlure se lève dans la fumée sur la nouvelle scène. */
  private async ouvrir(annule: () => boolean): Promise<void> {
    this.brule = false;
    const flamme = this.flamme().nativeElement;
    const lueur = this.lueur().nativeElement;
    const fumee = this.fumee().nativeElement;
    const feu = this.feu;
    this.titreVisible.set(false);
    if (this.reduit() || !feu) {
      flamme.style.opacity = lueur.style.opacity = '0';
      feu?.stop();
      return;
    }
    await attendre(TITRE_EFFACE_MS);
    if (annule()) {
      return;
    }
    fumee.style.opacity = '1';
    await animer(
      OUVERTURE_MS,
      (t) => {
        const k = 1 - Math.min(1, t * 1.7);
        flamme.style.opacity = String(k);
        lueur.style.opacity = String(0.8 * k);
        fumee.style.opacity = String(1 - t);
        fumee.style.transform = `translateY(${-12 * t}%) scale(${1 + 0.2 * t})`;
        feu.alpha = 1 - t;
        feu.rate = 55 * (1 - t);
      },
      EASE.sortie,
      annule,
    );
    if (!annule()) {
      feu.stop();
      fumee.style.transform = '';
    }
  }

  /** Dimensionne les calques sur l'écran et repart d'un champ de brûlure neuf, scène intacte. */
  private preparer(): RideauBrulure | null {
    const hote = this.hote.nativeElement;
    const largeur = BRULURE_LARGEUR;
    const hauteur = Math.max(40, Math.round((largeur * hote.clientHeight) / Math.max(1, hote.clientWidth)));
    const flamme = this.flamme().nativeElement;
    const lueur = this.lueur().nativeElement;
    flamme.width = lueur.width = largeur;
    flamme.height = lueur.height = hauteur;
    const fc = flamme.getContext('2d');
    const lc = lueur.getContext('2d');
    if (!fc || !lc) {
      return null;
    }
    const brulure = {champ: champDeBrulure(largeur, hauteur), largeur, hauteur, image: fc.createImageData(largeur, hauteur), flamme: fc, lueur: lc};
    peindreBrulure(brulure, -1);
    return brulure;
  }
}
