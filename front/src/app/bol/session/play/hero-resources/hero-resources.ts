import {ChangeDetectionStrategy, Component, effect, inject, input, model, OnInit, output, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {ValueTracker} from '../../value-tracker';
import {maybePromptDefierLaMort} from '../defier-la-mort-dialog/defier-la-mort.util';

export interface HeroResourcesData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
}

/** Vitalité de session et héroïsme d'un héros, ajustables par stepper et persistés à chaque pas.
 * Utilisé dans l'en-tête de la carte dépliée d'un héros (`bol-expanded-card`). L'héroïsme est un `model` :
 * le parent peut le partager avec le jet d'action, qui en dépense. */
@Component({
  selector: 'bol-hero-resources',
  imports: [ReactiveFormsModule, DwValueStepperComponent],
  template: `
    <div class="hrs-field">
      <span class="hrs-label">Vitalité ({{ vitalite() }} / {{ data().vitaliteMax }})</span>
      <dw-value-stepper [formControl]="vitaliteControl" [min]="-20" [max]="data().vitaliteMax" [ariaLabel]="'Vitalité'" />
    </div>
    <div class="hrs-field">
      <span class="hrs-label">Héroïsme ({{ heroisme() }})</span>
      <dw-value-stepper [formControl]="heroismeControl" [min]="0" [ariaLabel]="'Héroïsme'" />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 0.9rem;
    }

    .hrs-field {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
    }

    // Disposition en ligne : le libellé à gauche de son stepper, pour gagner de la hauteur.
    :host(.hrs--inline) {
      gap: 0.4rem 1.4rem;
    }

    :host(.hrs--inline) .hrs-field {
      flex-direction: row;
      gap: 0.5rem;
    }

    .hrs-label {
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--dw-surface-500);
      white-space: nowrap;
    }
  `,
  host: {'[class.hrs--inline]': "layout() === 'inline'"},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroResourcesComponent implements OnInit {
  readonly data = input.required<HeroResourcesData>();
  readonly heroisme = model.required<number>();
  /** `inline` : libellé à gauche du stepper (carte dépliée) ; `stacked` : libellé au-dessus. */
  readonly layout = input<'stacked' | 'inline'>('stacked');
  /** Une valeur a été persistée : le parent recharge la session. */
  readonly changed = output<void>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  protected readonly vitaliteControl = new FormControl(0, {nonNullable: true});
  protected readonly heroismeControl = new FormControl(0, {nonNullable: true});
  /** Miroir en signal de la vitalité affichée dans le libellé (un `FormControl.value` lu dans un
   * template OnPush ne se rafraîchit pas après un `setValue` venu d'un callback asynchrone). */
  protected readonly vitalite = signal(0);

  private readonly vitaliteTracker = new ValueTracker();

  constructor() {
    // L'héroïsme peut changer hors de ce composant (dépense dans le jet d'action) : le stepper suit.
    effect(() => {
      const heroisme = this.heroisme();
      if (heroisme !== this.heroismeControl.value) {
        this.heroismeControl.setValue(heroisme, {emitEvent: false});
      }
    });

    this.vitaliteControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onVitaliteChange(value));
    this.heroismeControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onHeroismeChange(value));
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
        this.changed.emit();

        if (value < 0) {
          maybePromptDefierLaMort({
            dialog: this.dialog,
            fightSessionService: this.fightSessionService,
            herosService: this.herosService,
            sessionId: data.sessionId,
            herosId: data.herosId,
            pivotId: data.pivotId,
            heroNom: data.heroNom,
            vitaliteCourante: value,
            heroisme: this.heroisme(),
            onApplied: () => {
              if (value >= -5) {
                this.setVitalite(0);
              }
              this.heroisme.update((h) => h - 1);
            },
          });
        }
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
          duration: 5000,
        });
        this.setVitalite(previous);
      },
    });
  }

  private onHeroismeChange(value: number): void {
    const previous = this.heroisme();
    const delta = value - previous;
    if (delta === 0) {
      return;
    }

    this.heroisme.set(value);
    this.herosService.adjustHeroisme(this.data().herosId, delta).subscribe({
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
