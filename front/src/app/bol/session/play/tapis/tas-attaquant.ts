import {ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, signal, untracked, viewChild} from '@angular/core';
import {A11yModule} from '@angular/cdk/a11y';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {CombattantCarteComponent} from './combattant-carte';
import {DwArmeIconComponent} from '../../../shared/arme/arme-icon';
import {DwPopoverDirective} from '../../../../shared/popover/popover.directive';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {EffectsListComponent} from './effects-list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RideauEtat, RideauRythme, SceneCarton} from '../../models/theatre.model';
import {RideauComponent} from '../theatre/rideau';
import {PointsStepperComponent} from './points-stepper';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnCibleStore} from './turn-cible.store';
import {TurnFlowStore} from './turn-flow.store';

/** La main passe vite : un tour revient bien plus souvent qu'une scène. */
const RYTHME_PASSAGE: RideauRythme = {fondu: 800, effacement: 150, ouverture: 1000};
/** Combien de temps le nom de celui qui joue reste à l'écran. */
const NOM_TENUE_MS = 700;

/** Qui joue : une ligne lue de gauche à droite, sans popover pour préparer le coup — sa vie et ses points, ses chiffres, ce que dit le MJ, sa posture, ses armes, puis ce qu'il peut faire au lieu d'attaquer et la fin de son tour. */
@Component({
  selector: 'bol-tas-attaquant',
  imports: [RideauComponent, A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatIconModule, MatTooltipModule, DwArmeIconComponent, DwValueStepperComponent, DwPopoverDirective, CombattantCarteComponent, EffectsListComponent, PointsStepperComponent],
  templateUrl: './tas-attaquant.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasAttaquantComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly attack = inject(TurnAttackStore);
  protected readonly cible = inject(TurnCibleStore);
  protected readonly flow = inject(TurnFlowStore);

  private readonly hote = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tete = viewChild.required('tete', {read: ElementRef<HTMLElement>});

  protected readonly rythmePassage = RYTHME_PASSAGE;
  protected readonly passage = signal<RideauEtat>('ouvert');
  protected readonly carton = signal<SceneCarton | null>(null);

  private fantome: HTMLElement | null = null;
  private retraitFantome: ReturnType<typeof setTimeout> | undefined;
  private ouverture: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    // Cet effet passe avant le rendu de ce bloc : la ligne montre encore celui qui vient de jouer.
    let precedente: string | null = null;
    effect(() => {
      const cle = this.turn.cardKey();
      untracked(() => {
        if (precedente !== null && precedente !== cle) {
          this.passerLaMain();
        }
        precedente = cle;
      });
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.retraitFantome);
      clearTimeout(this.ouverture);
    });
  }

  /** La carte change dès que le serveur répond : une copie de l'ancienne reste sous les flammes, le temps qu'elle brûle. Moins d'animations : pas de rideau, la carte change d'un coup. */
  private passerLaMain(): void {
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    // La main repasse pendant que ça brûle : le nom change, l'ancienne carte continue de brûler.
    if (this.passage() === 'ouvert') {
      this.poserFantome();
    }
    this.carton.set({titre: this.turn.card().nom});
    this.passage.set('ferme');
    clearTimeout(this.ouverture);
    this.ouverture = setTimeout(() => this.passage.set('ouvert'), RYTHME_PASSAGE.fondu + NOM_TENUE_MS);
  }

  private poserFantome(): void {
    this.fantome?.remove();
    const tete = this.tete().nativeElement;
    const copie = tete.cloneNode(true) as HTMLElement;
    // Une copie ne garde ni ce qui est saisi dans ses champs, ni le droit de porter les mêmes identifiants.
    const champs = tete.querySelectorAll('input');
    copie.querySelectorAll('input').forEach((champ, index) => (champ.value = champs[index].value));
    copie.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
    copie.classList.add('tas-head-fantome');
    copie.setAttribute('aria-hidden', 'true');
    copie.inert = true;
    this.hote.nativeElement.appendChild(copie);
    this.fantome = copie;
    clearTimeout(this.retraitFantome);
    this.retraitFantome = setTimeout(() => {
      copie.remove();
      this.fantome = null;
    }, RYTHME_PASSAGE.fondu);
  }
}
