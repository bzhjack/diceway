import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {postCombatRecoveryAmount} from '../../combat-play.util';
import {AfterCombatDialogData, AfterCombatGain} from '../../models/after-combat-dialog.model';
import {medicalCareAmount} from '../../rescue.util';

/** Bascule un indice dans un ensemble : présent, il en sort ; absent, il y entre. */
function toggled(set: ReadonlySet<number>, index: number): ReadonlySet<number> {
  const next = new Set(set);
  if (!next.delete(index)) {
    next.add(index);
  }
  return next;
}

/** « Après combat » (02-actions-combat.md, « Récupération », livre p. 65-66), ouvert par « Terminer le combat » : pour chaque blessé du
 * camp des héros, le court repos d'après combat (la moitié des points perdus pendant ce combat, les dégâts à mains nues en entier ; rien
 * sous 0, rien pour une blessure d'avant le combat ; 1 point de plus avec Récupération rapide, rien pour un Souffreteux) et, si un
 * héros a une carrière de soins, les soins médicaux (le rang du soigneur, tout de suite). Le MJ décoche ce qui ne s'applique pas ; rien
 * n'est enregistré avant « Terminer le combat », et « Annuler » laisse le combat en cours. */
@Component({
  selector: 'bol-after-combat-dialog',
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule],
  templateUrl: './after-combat-dialog.html',
  styleUrl: './after-combat-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AfterCombatDialogComponent {
  protected readonly data = inject<AfterCombatDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AfterCombatDialogComponent, readonly AfterCombatGain[]>);

  /** Le soigneur le mieux classé est proposé d'office ; `null` : personne ne soigne. */
  protected readonly healerIndex = signal<number | null>(
    this.data.healers.length === 0 ? null : this.data.healers.reduce((best, h, i, all) => (h.carriere.value > all[best].carriere.value ? i : best), 0),
  );
  protected readonly healer = computed(() => {
    const index = this.healerIndex();
    return index === null ? null : this.data.healers[index];
  });
  /** Qui se repose, qui est soigné : tout le monde au départ — le repos ne rend rien sous 0, il est alors sans effet. */
  protected readonly resting = signal<ReadonlySet<number>>(new Set(this.data.wounded.map((_, i) => i)));
  protected readonly cared = signal<ReadonlySet<number>>(new Set(this.data.wounded.map((_, i) => i)));

  protected readonly rows = computed(() => {
    const rank = this.healer()?.carriere.value ?? 0;
    return this.data.wounded.map((w, index) => {
      const restable = postCombatRecoveryAmount(w.vitalite, w.vitaliteDepart, w.mainsNues, w);
      const rest = this.resting().has(index) ? restable : 0;
      const careable = this.healer() ? medicalCareAmount(w.vitalite + rest, w.vitaliteMax, rank) : 0;
      const care = this.cared().has(index) ? careable : 0;
      const bagarre = Math.min(w.mainsNues, Math.max(0, w.vitaliteDepart - w.vitalite));
      return {w, index, restable, rest, careable, care, bagarre, after: w.vitalite + rest + care};
    });
  });
  protected readonly gains = computed<readonly AfterCombatGain[]>(() =>
    this.rows()
      .filter((row) => row.rest + row.care > 0)
      .map(({w, rest, care}) => ({kind: w.kind, pivotId: w.pivotId, nom: w.nom, amount: rest + care})),
  );

  protected toggleRest(index: number): void {
    this.resting.update((set) => toggled(set, index));
  }

  protected toggleCare(index: number): void {
    this.cared.update((set) => toggled(set, index));
  }

  protected finish(): void {
    this.ref.close(this.gains());
  }
}
