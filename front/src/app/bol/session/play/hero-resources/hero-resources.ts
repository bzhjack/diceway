import {ChangeDetectionStrategy, Component, computed, inject, input, model, OnInit, output, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {heroismeGems} from '../../heroisme-spend.util';
import {ValueTracker} from '../../value-tracker';
import {HeroResourcesData} from '../../models/hero-resources.model';

/** Vitalité de session et héroïsme d'un héros, ajustables pas à pas et persistés à chaque pas : un cœur et sa jauge pour la vitalité,
 * une rangée de gemmes pour l'héroïsme. Utilisé dans le bandeau de la carte dépliée d’un héros (`bol-expanded-card`).
 * L'héroïsme est un `model` : le parent le partage avec le jet d'action, qui en dépense. */
@Component({
  selector: 'bol-hero-resources',
  imports: [ReactiveFormsModule, DwValueStepperComponent],
  template: `
    <div class="hrs-field">
      <span class="hrs-label">Vitalité · max {{ data().vitaliteMax }}</span>
      <dw-value-stepper [formControl]="vitaliteControl" [min]="-20" [max]="data().vitaliteMax" [ariaLabel]="'Vitalité'" [heart]="true" />
      <span class="hrs-bar" aria-hidden="true"><i [style.width.%]="vitalitePercent()"></i></span>
    </div>
    <div class="hrs-field">
      <span class="hrs-label">Héroïsme</span>
      <div class="hrs-heroisme" role="group" aria-label="Héroïsme">
        <button type="button" class="hrs-step" aria-label="Retirer un point d’héroïsme" [disabled]="heroisme() <= 0" (click)="stepHeroisme(-1)">−</button>
        <span class="hrs-gems" role="img" [attr.aria-label]="heroisme() + ' points d’héroïsme'">
          @for (lit of gems(); track $index) {
            <i class="hrs-gem" [class.hrs-gem--on]="lit"></i>
          }
        </span>
        <button type="button" class="hrs-step" aria-label="Ajouter un point d’héroïsme" (click)="stepHeroisme(1)">+</button>
      </div>
    </div>
  `,
  styles: `
    // Deux tuiles, du même style que les statistiques de combat de la carte : le libellé au-dessus, le stepper
    // dessous. Contrairement à elles, ces valeurs se modifient.
    :host {
      display: flex;
      gap: 0.3rem;
    }

    .hrs-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.1rem;
      padding: 0.2rem 0.4rem 0.25rem;
      border: 1px solid var(--dw-border);
      border-radius: 6px;
      background: var(--dw-surface-100);
    }

    // Cœur de la vitalité, plus petit que sur le reste de l'app : les tuiles de cet en-tête sont serrées.
    dw-value-stepper {
      --vs-heart-width: var(--hrs-heart-width, 2.1rem);
      --vs-heart-height: var(--hrs-heart-height, 1.9rem);
      --vs-heart-font: var(--hrs-heart-font, 0.8rem);
    }

    // Jauge de vitalité sous le cœur : du rouge au vert, à la mesure de ce qu'il reste.
    .hrs-bar {
      align-self: stretch;
      height: 5px;
      margin-top: 0.15rem;
      border-radius: 3px;
      background: var(--dw-surface-300);
      overflow: hidden;

      i {
        display: block;
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, var(--dw-color-echec-forte), var(--dw-color-reussite));
      }
    }

    // Héroïsme : une gemme par point, allumée s'il reste à dépenser.
    .hrs-heroisme {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .hrs-gems {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.25rem;
    }

    .hrs-gem {
      width: 0.85rem;
      height: 1.1rem;
      background: var(--dw-surface-300);
      clip-path: polygon(50% 0, 100% 38%, 50% 100%, 0 38%);
    }

    .hrs-gem--on {
      background: linear-gradient(160deg, #fde68a, var(--dw-color-legendary) 55%, #8a5a12);
    }

    .hrs-step {
      flex: none;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: 1px solid var(--dw-border);
      border-radius: 50%;
      background: transparent;
      color: var(--dw-surface-500);
      font: inherit;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: var(--dw-color-legendary);
        color: var(--dw-color-legendary);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 1px;
      }

      &:disabled {
        opacity: 0.35;
        cursor: default;
      }
    }

    .hrs-label {
      font-size: 0.56rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--dw-surface-500);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroResourcesComponent implements OnInit {
  readonly data = input.required<HeroResourcesData>();
  readonly heroisme = model.required<number>();
  /** Une valeur a été persistée : le parent recharge la session. */
  readonly changed = output<void>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly vitaliteControl = new FormControl(0, {nonNullable: true});
  /** Miroir en signal de la vitalité affichée dans le libellé (un `FormControl.value` lu dans un
   * template OnPush ne se rafraîchit pas après un `setValue` venu d'un callback asynchrone). */
  protected readonly vitalite = signal(0);
  /** Part de vitalité restante, de 0 à 100, pour la jauge sous le cœur. */
  protected readonly vitalitePercent = computed(() => {
    const max = this.data().vitaliteMax;
    return max > 0 ? Math.max(0, Math.min(100, (this.vitalite() / max) * 100)) : 0;
  });
  /** Une gemme par point d'héroïsme, allumée s'il reste à dépenser. */
  protected readonly gems = computed(() => heroismeGems(this.heroisme()));

  private readonly vitaliteTracker = new ValueTracker();

  constructor() {
    this.vitaliteControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onVitaliteChange(value));
  }

  // Valeurs initiales posées ici (pas en initialiseur de champ) : un input required n'a pas encore
  // de valeur à ce moment-là (NG8118).
  ngOnInit(): void {
    this.setVitalite(this.data().vitaliteCourante);
  }

  private setVitalite(value: number): void {
    this.vitaliteTracker.reset(value);
    this.vitalite.set(value);
    this.vitaliteControl.setValue(value, {emitEvent: false});
  }

  private onVitaliteChange(value: number): void {
    const previous = this.vitaliteTracker.value;
    const delta = this.vitaliteTracker.take(value);
    if (delta === 0) {
      return;
    }

    this.vitalite.set(value);
    const data = this.data();
    this.fightSessionService.applyDamage(data.sessionId, 'hero', data.pivotId, delta).subscribe({
      next: () => {
        // Un ajustement à la main ne propose jamais « Défier la mort » : seuls les dégâts reçus au combat le font.
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
          duration: 5000,
        });
        this.setVitalite(previous);
      },
    });
  }

  /** Un point d'héroïsme de plus ou de moins, jamais sous zéro. */
  protected stepHeroisme(delta: number): void {
    const previous = this.heroisme();
    const value = Math.max(0, previous + delta);
    if (value === previous) {
      return;
    }

    this.heroisme.set(value);
    this.herosService.adjustHeroisme(this.data().herosId, value - previous).subscribe({
      next: () => this.changed.emit(),
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'héroïsme."), 'Fermer', {
          duration: 5000,
        });
        this.heroisme.set(previous);
      },
    });
  }
}
