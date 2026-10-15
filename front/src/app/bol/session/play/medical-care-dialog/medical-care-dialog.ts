import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MedicalCare, MedicalCareDialogData} from '../../models/medical-care-dialog.model';
import {medicalCareAmount} from '../../rescue.util';

/** « Soins médicaux » en fin de combat (02-actions-combat.md, « Récupération ») : un héros qui a une carrière de soins rend tout de suite
 * son rang en vitalité aux blessés qu'il soigne. Le MJ choisit le soigneur et les blessés ; « Passer » ne soigne personne. */
@Component({
  selector: 'bol-medical-care-dialog',
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule],
  templateUrl: './medical-care-dialog.html',
  styleUrl: './medical-care-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicalCareDialogComponent {
  protected readonly data = inject<MedicalCareDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<MedicalCareDialogComponent, readonly MedicalCare[]>);

  /** Le soigneur le mieux classé est proposé d'office. */
  protected readonly healerIndex = signal(this.data.healers.reduce((best, h, i, all) => (h.carriere.value > all[best].carriere.value ? i : best), 0));
  protected readonly healer = computed(() => this.data.healers[this.healerIndex()]);
  /** Les blessés cochés, par leur rang dans la liste : tous au départ. */
  protected readonly checked = signal<ReadonlySet<number>>(new Set(this.data.patients.map((_, i) => i)));

  protected readonly rows = computed(() =>
    this.data.patients.map((p, i) => {
      const amount = medicalCareAmount(p.vitalite, p.vitaliteMax, this.healer().carriere.value);
      return {patient: p, index: i, amount, checked: this.checked().has(i)};
    }),
  );
  protected readonly cares = computed<readonly MedicalCare[]>(() =>
    this.rows()
      .filter((row) => row.checked && row.amount > 0)
      .map(({patient, amount}) => ({kind: patient.kind, pivotId: patient.pivotId, nom: patient.nom, amount})),
  );

  protected toggle(index: number): void {
    this.checked.update((set) => {
      const next = new Set(set);
      if (!next.delete(index)) {
        next.add(index);
      }
      return next;
    });
  }

  protected heal(): void {
    this.ref.close(this.cares());
  }
}
