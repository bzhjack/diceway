import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatSnackBar} from '@angular/material/snack-bar';
import {take} from 'rxjs';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {InitiativeResultat} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {AddCombatantDialogComponent} from '../add-combatant-dialog/add-combatant-dialog';
import {InitiativeRollDialogComponent} from '../../initiative-roll-dialog/initiative-roll-dialog';

export interface StartCombatDialogData {
  readonly sessionId: string;
}

interface AdversaryRow {
  readonly nom: string;
}

interface HeroRow {
  readonly pivotId: number;
  readonly herosId: string;
  readonly nom: string;
  readonly resultat: InitiativeResultat | null;
}

/** Ajoute les adversaires (dialog existant, réutilisé) puis fait rouler l'initiative de chaque héros avant de démarrer le combat. */
@Component({
  selector: 'bol-start-combat-dialog',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './start-combat-dialog.html',
  styleUrl: './start-combat-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartCombatDialogComponent {
  protected readonly ref = inject(MatDialogRef<StartCombatDialogComponent, boolean>);
  private readonly data = inject<StartCombatDialogData>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly starting = signal(false);
  protected readonly adversaries = signal<readonly AdversaryRow[]>([]);
  protected readonly heroes = signal<readonly HeroRow[]>([]);
  protected readonly existingHeroIds = signal<ReadonlySet<string>>(new Set());
  protected readonly existingPnjIds = signal<ReadonlySet<string>>(new Set());

  protected readonly canStart = computed(
    () => this.adversaries().length > 0 && this.heroes().every((h) => h.resultat !== null),
  );

  constructor() {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.fightSessionService
      .fightSession(this.data.sessionId)
      .pipe(take(1))
      .subscribe({
        next: (session) => {
          this.adversaries.set([
            ...(session.pnjs ?? []).map((p) => ({nom: p.surnom ?? p.nom})),
            ...(session.creatures ?? []).map((c) => ({nom: c.surnom ?? c.nom})),
            ...(session.demons ?? []).map((d) => ({nom: d.surnom ?? d.nom})),
          ]);
          this.existingHeroIds.set(new Set((session.heros ?? []).map((h) => String(h.heros_id))));
          this.existingPnjIds.set(
            new Set((session.pnjs ?? []).map((p) => p.pnj_id).filter((id): id is string => !!id).map(String)),
          );

          const previousResultats = new Map(this.heroes().map((h) => [h.pivotId, h.resultat]));
          this.heroes.set(
            (session.heros ?? []).map((h) => ({
              pivotId: h.id,
              herosId: h.heros_id,
              nom: h.heros?.origines.nom ?? 'Héros',
              resultat: previousResultats.get(h.id) ?? h.initiative_resultat,
            })),
          );
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de charger la session.'), 'Fermer', {
            duration: 5000,
          });
        },
      });
  }

  protected openAddAdversary(): void {
    this.dialog
      .open(AddCombatantDialogComponent, {
        width: 'min(760px, 94vw)',
        maxWidth: '94vw',
        maxHeight: '85vh',
        data: {
          sessionId: this.data.sessionId,
          existingHeroIds: this.existingHeroIds(),
          existingPnjIds: this.existingPnjIds(),
        },
      })
      .afterClosed()
      .subscribe(() => this.reload());
  }

  protected rollInitiative(hero: HeroRow): void {
    this.herosService
      .heros(hero.herosId)
      .pipe(take(1))
      .subscribe((h) => {
        this.dialog
          .open(InitiativeRollDialogComponent, {
            maxWidth: 'min(30rem, 92vw)',
            panelClass: 'ird-panel',
            data: {
              heroNom: hero.nom,
              esprit: h.attributs.esprit,
              initiative: h.combat.initiative,
              modifierTotal: 0,
            },
          })
          .afterClosed()
          .subscribe((resultat: InitiativeResultat | undefined) => {
            if (!resultat) {
              return;
            }

            this.fightSessionService.updateHeroInitiative(this.data.sessionId, hero.pivotId, resultat).subscribe({
              next: () => {
                this.heroes.update((list) =>
                  list.map((h2) => (h2.pivotId === hero.pivotId ? {...h2, resultat} : h2)),
                );
              },
              error: (error: unknown) => {
                this.snackBar.open(
                  extractApiErrorMessage(error, "Impossible d'enregistrer ce jet d'initiative."),
                  'Fermer',
                  {duration: 5000},
                );
              },
            });
          });
      });
  }

  protected start(): void {
    this.starting.set(true);
    this.fightSessionService.startCombat(this.data.sessionId).subscribe({
      next: () => {
        this.starting.set(false);
        this.ref.close(true);
      },
      error: (error: unknown) => {
        this.starting.set(false);
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de démarrer le combat.'), 'Fermer', {
          duration: 5000,
        });
      },
    });
  }

  protected close(): void {
    this.ref.close(undefined);
  }
}
