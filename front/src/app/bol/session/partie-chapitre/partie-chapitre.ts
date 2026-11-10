import {ChangeDetectionStrategy, Component, DestroyRef, inject, input, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatButtonModule} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {chapitresDuScenario, scenariosLibresPour} from '../accueil/accueil.util';
import {AccueilPartie, AccueilScenarioChoix} from '../models/accueil.model';
import {ignoresMessage} from '../play/scene-list/scene.util';
import {libelleDeChapitre} from '../scenario.util';

/**
 * « Changer de chapitre » d'une partie, sur le bandeau de l'accueil et sur chaque ligne de « Mes parties » : les chapitres de son scénario
 * (le courant en gras, ceux qu'elle a joués marqués), puis « Marquer le scénario terminé » ; pour une partie improvisée, « Choisir un
 * scénario » parmi ceux que sa compagnie ne joue pas déjà. Grisé en plein combat. Si des figurants partiraient, le MJ confirme d'abord.
 * Une fois la partie changée, `modifiee` : la page relit ce qu'elle montre.
 */
@Component({
  selector: 'bol-partie-chapitre',
  imports: [MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
  template: `
    @if (partie().enCombat) {
      <button mat-stroked-button type="button" class="pch-bouton" disabled>
        <mat-icon>swap_horiz</mat-icon> {{ partie().scenarioId ? 'Changer de chapitre' : 'Choisir un scénario' }} : combat en cours
      </button>
    } @else if (partie().scenarioId) {
      <button mat-stroked-button type="button" class="pch-bouton" [matMenuTriggerFor]="menuChapitres">
        <mat-icon>swap_horiz</mat-icon> Changer de chapitre
      </button>
    } @else {
      <button mat-stroked-button type="button" class="pch-bouton" [matMenuTriggerFor]="menuScenarios">
        <mat-icon>auto_stories</mat-icon> Choisir un scénario
      </button>
    }

    <mat-menu #menuChapitres="matMenu">
      <ng-template matMenuContent>
        @for (chapitre of chapitres(); track chapitre.id) {
          <button mat-menu-item type="button" (click)="changerChapitre(chapitre.id)">
            <span [class.pch-courant]="chapitre.courant">{{ chapitre.libelle }}</span>
            @if (chapitre.courant) {
              <span class="sr-only">, en cours</span>
            }
            @if (chapitre.joue) {
              <span class="pch-etat">&nbsp;· joué</span>
            }
          </button>
        }
        <!-- La fin du scénario suit ses chapitres. -->
        <mat-divider />
        @if (partie().termine) {
          <button mat-menu-item type="button" (click)="marquerTermine(false)">
            <mat-icon>undo</mat-icon><span>Scénario pas encore terminé</span>
          </button>
        } @else {
          <button mat-menu-item type="button" (click)="marquerTermine(true)">
            <mat-icon>flag</mat-icon><span>Marquer le scénario terminé</span>
          </button>
        }
      </ng-template>
    </mat-menu>
    <mat-menu #menuScenarios="matMenu">
      <ng-template matMenuContent>
        @for (scenario of scenarios(); track scenario.id) {
          <button mat-menu-item type="button" [matMenuTriggerFor]="menuChapitresDuScenario" [matMenuTriggerData]="{scenario}">
            {{ scenario.nom }}
          </button>
        } @empty {
          <p class="pch-vide">Aucun autre scénario à lui proposer.</p>
        }
      </ng-template>
    </mat-menu>
    <mat-menu #menuChapitresDuScenario="matMenu">
      <ng-template matMenuContent let-scenario="scenario">
        @for (chapitre of scenario.chapitres; track chapitre.id) {
          <button mat-menu-item type="button" (click)="changerChapitre(chapitre.id)">{{ chapitre.libelle }}</button>
        }
      </ng-template>
    </mat-menu>
  `,
  styles: `
    :host {
      display: contents;
    }

    .pch-courant {
      font-weight: 800;
    }

    .pch-etat {
      font-size: 0.8rem;
      color: var(--dw-forge-bone);
    }

    .pch-vide {
      margin: 0;
      padding: 0.75rem 1rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartieChapitreComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly partie = input.required<AccueilPartie>();
  /** Ce que l'accueil a lu du compte : les chapitres de chaque scénario, les scénarios que joue chaque compagnie. */
  readonly accueil = input.required<BolAccueilModel>();
  /** La partie a changé de chapitre ou de scénario, ou elle est marquée terminée (ou ne l'est plus). */
  readonly modifiee = output<void>();

  /** Les chapitres de son scénario, dans l'ordre de ses pastilles : le courant, et ceux qu'elle a joués. Lus à l'ouverture du menu. */
  protected chapitres(): {id: string; libelle: string; courant: boolean; joue: boolean}[] {
    const partie = this.partie();
    return chapitresDuScenario(partie.scenarioId, this.accueil().scenarios).map((c, i) => ({
      id: c.id,
      libelle: libelleDeChapitre(c.numero, c.titre),
      courant: c.id === partie.scenarioId,
      joue: partie.reperes[i]?.etat === 'joue',
    }));
  }

  /** Pour une partie improvisée : les scénarios que sa compagnie ne joue pas déjà. */
  protected scenarios(): AccueilScenarioChoix[] {
    return scenariosLibresPour(this.partie().id, this.accueil());
  }

  /** Passe la partie sur ce chapitre (de son scénario, ou le premier d'une partie improvisée). Si des figurants partiraient, le MJ confirme
   * d'abord : ils ne reviennent pas. */
  protected changerChapitre(chapitreId: string): void {
    const partie = this.partie();
    if (chapitreId === partie.scenarioId) {
      return;
    }
    const n = partie.figurantsARetirer;
    if (n === 0) {
      this.appliquerChapitre(partie.id, chapitreId);
      return;
    }
    confirmDialog(
      this.dialog,
      {
        title: 'Changer de chapitre',
        message: `La table passe à la première scène de ce chapitre : ${n > 1 ? `ses ${n} figurants partent, avec leurs blessures` : 'son figurant part, avec ses blessures'}. Les héros et leurs alliés restent.`,
        confirmLabel: 'Changer de chapitre',
      },
      {width: '420px'},
    ).subscribe((confirme) => {
      if (confirme) {
        this.appliquerChapitre(partie.id, chapitreId);
      }
    });
  }

  private appliquerChapitre(partieId: string, chapitreId: string): void {
    this.fightSessionService
      .changerChapitre(partieId, chapitreId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.modifiee.emit();
          const ignores = ignoresMessage(session.figurants_ignores);
          if (ignores) {
            this.snackBar.open(ignores, 'OK', {duration: 6000});
          }
        },
        error: (error: unknown) =>
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de changer le chapitre de la partie.'), 'OK', {duration: 6000}),
      });
  }

  /** Le MJ dit que la partie a fini son scénario, ou se ravise. Pas de confirmation : ça se défait d'un clic. */
  protected marquerTermine(termine: boolean): void {
    this.fightSessionService
      .marquerScenarioTermine(this.partie().id, termine)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.modifiee.emit(),
        error: (error: unknown) => this.snackBar.open(extractApiErrorMessage(error, 'Impossible de marquer le scénario.'), 'OK', {duration: 6000}),
      });
  }
}
