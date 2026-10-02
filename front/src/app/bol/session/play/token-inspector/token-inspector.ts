import {ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolStatblockComponent, BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {ActionRollData, LastRoll} from '../../action-roll.util';
import {PlayToken} from '../../combat-play.util';
import {ValueTracker} from '../../value-tracker';
import {ActionRollPanelComponent} from '../action-roll-panel/action-roll-panel';
import {HeroResourcesComponent, HeroResourcesData} from '../hero-resources/hero-resources';

export interface TokenInspectorHeroData {
  readonly resources: HeroResourcesData;
  readonly actionRoll: ActionRollData;
}

const KIND_LABELS: Record<PlayToken['kind'], string> = {
  hero: 'Héros',
  pnj: 'PNJ',
  creature: 'Créature',
  demon: 'Démon',
};

/** Fiche du jeton sélectionné sur la table (mode libre). Héros : ressources, jet d'action, accès à la
 * fiche complète. PNJ / créature / démon : vitalité, statbloc, retrait de la table. Ne recharge rien
 * elle-même : toute modification remonte à `session-play-page` par événement. */
@Component({
  selector: 'bol-token-inspector',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    DwValueStepperComponent,
    BolStatblockComponent,
    ActionRollPanelComponent,
    HeroResourcesComponent,
  ],
  templateUrl: './token-inspector.html',
  styleUrl: './token-inspector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenInspectorComponent {
  readonly token = input.required<PlayToken>();
  readonly sessionId = input.required<string>();
  readonly hero = input<TokenInspectorHeroData | null>(null);
  readonly statblock = input<BolStatblockData | null>(null);
  readonly returnUrl = input<string | null>(null);

  readonly closed = output<void>();
  readonly changed = output<void>();
  readonly rolled = output<LastRoll>();
  readonly removeRequested = output<PlayToken>();
  readonly fullSheetRequested = output<PlayToken>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  /** Héroïsme vivant du héros affiché, partagé entre les ressources et le jet d'action. Repart de la
   * valeur chargée à chaque nouveau héros. */
  protected readonly heroisme = linkedSignal(() => this.hero()?.actionRoll.heroisme ?? 0);

  protected readonly subtitle = computed(() => {
    const hero = this.hero();
    if (this.token().kind === 'hero' && hero) {
      const carrieres = hero.actionRoll.carrieres.map((c) => `${c.label} ${c.value}`).join(' · ');
      return carrieres || KIND_LABELS.hero;
    }
    return KIND_LABELS[this.token().kind];
  });

  protected readonly vitaliteControl = new FormControl(0, {nonNullable: true});
  private readonly vitaliteTracker = new ValueTracker();

  constructor() {
    // La vitalité d'un non-héros vient du snapshot de session : le stepper suit chaque rechargement
    // (et chaque changement de jeton, la fiche étant réutilisée d'un jeton à l'autre).
    effect(() => {
      const vitalite = this.token().vitaliteCourante ?? 0;
      this.vitaliteTracker.reset(vitalite);
      if (vitalite !== this.vitaliteControl.value) {
        this.vitaliteControl.setValue(vitalite, {emitEvent: false});
      }
    });

    this.vitaliteControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onVitaliteChange(value));
  }

  private onVitaliteChange(value: number): void {
    const previous = this.vitaliteTracker.value;
    const delta = this.vitaliteTracker.take(value);
    if (delta === 0) {
      return;
    }

    const token = this.token();
    this.fightSessionService
      .applyDamage(this.sessionId(), token.kind, token.pivotId, delta, token.instanceIndex)
      .subscribe({
        next: () => this.changed.emit(),
        error: (error: unknown) => {
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
            duration: 5000,
          });
          this.vitaliteTracker.reset(previous);
          this.vitaliteControl.setValue(previous, {emitEvent: false});
        },
      });
  }
}
