import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MassacrePietailleDialogData, MassacrePietailleResult} from '../../models/massacre-pietaille-dialog.model';
import {tombesMassacre} from '../tapis/options-heroiques.util';

/** « Massacrer la piétaille » (option de succès héroïque, livre p. 59) : les dégâts du coup sont le nombre de piétailles mises hors de
 * combat. L'application en coche autant, la cible d'abord ; le MJ coche ou décoche, et « Appliquer » rend la liste. */
@Component({
  selector: 'bol-massacre-pietaille-dialog',
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="mpm-title">
      <mat-icon svgIcon="sword" />
      Massacrer la piétaille
    </h2>
    <mat-dialog-content class="mpm-content">
      <p class="mpm-lead">
        Les {{ data.degats }} {{ data.degats > 1 ? 'dégâts' : 'dégât' }} du coup de {{ data.attaquantNom }} sont le nombre de piétailles mises hors de
        combat : pas forcément mortes, mais elles ne reviendront pas de sitôt.
      </p>
      <ul class="mpm-list" aria-label="Qui tombe">
        @for (card of data.candidats; track card.key) {
          <li>
            <mat-checkbox [checked]="tombes().has(card.key)" (change)="toggle(card.key)">
              {{ card.nom }} <small>{{ card.vitaliteCourante ?? card.vitaliteMax }} / {{ card.vitaliteMax }}</small>
            </mat-checkbox>
          </li>
        }
      </ul>
      <p class="mpm-bilan" aria-live="polite">{{ bilan() }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Annuler</button>
      <button mat-flat-button type="button" (click)="apply()">Appliquer</button>
    </mat-dialog-actions>
  `,
  styles: `
    .mpm-title { display: flex; align-items: center; gap: 0.5rem; }
    .mpm-content { display: grid; gap: 0.6rem; }
    .mpm-content p { margin: 0; }
    .mpm-lead { font-size: 0.85rem; color: var(--dw-surface-600); }
    .mpm-list { display: grid; gap: 0.1rem; margin: 0; padding: 0; list-style: none; }
    .mpm-list small { margin-left: 0.3rem; color: var(--dw-surface-500); }
    .mpm-bilan { font-weight: 700; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MassacrePietailleDialogComponent {
  protected readonly data = inject<MassacrePietailleDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<MassacrePietailleDialogComponent, MassacrePietailleResult>);

  protected readonly tombes = signal<ReadonlySet<string>>(new Set(tombesMassacre(this.data.candidats, this.data.degats)));

  protected readonly bilan = computed(() => {
    const n = this.tombes().size;
    return n === 0 ? 'Personne ne tombe.' : `${n} ${n > 1 ? 'tombent' : 'tombe'}.`;
  });

  protected toggle(key: string): void {
    this.tombes.update((tombes) => {
      const next = new Set(tombes);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }

  protected apply(): void {
    // Dans l'ordre proposé (la cible d'abord), pas dans l'ordre des clics.
    this.ref.close({tombes: this.data.candidats.filter((card) => this.tombes().has(card.key)).map((card) => card.key)});
  }
}
