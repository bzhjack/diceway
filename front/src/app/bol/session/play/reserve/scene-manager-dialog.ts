import {ChangeDetectionStrategy, Component, inject, Signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {SceneListComponent} from '../scene-list/scene-list';

export interface SceneManagerDialogData {
  readonly sessionId: string;
  /** Signaux, pas des valeurs figées à l'ouverture : charger une scène depuis le dialogue change la
   * scène courante et le nombre de personnages sur la table, et la liste doit le voir (marqueur « en
   * cours », question « Remplacer ou Ajouter » au chargement suivant). */
  readonly currentSceneId: Signal<string | null>;
  readonly nonHeroCount: Signal<number>;
  /** Appelé à chaque opération qui a modifié la session (scène chargée, renommée, supprimée…). */
  readonly onChanged: () => void;
}

/** Gestion fine des scènes (notes, renommer, réordonner, mettre à jour, supprimer, nouveau scénario) :
 * la liste complète `bol-scene-list`, ouverte depuis le bandeau de réserve où il n'y a de place que
 * pour des puces. */
@Component({
  selector: 'bol-scene-manager-dialog',
  imports: [MatDialogModule, MatButtonModule, SceneListComponent],
  template: `
    <h2 mat-dialog-title>Gérer les scènes</h2>
    <mat-dialog-content class="smd-content">
      <bol-scene-list
        [sessionId]="data.sessionId"
        [currentSceneId]="data.currentSceneId()"
        [nonHeroCount]="data.nonHeroCount()"
        (changed)="data.onChanged()"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: `
    .smd-content {
      display: flex;
      height: min(32rem, 70vh);
      padding-top: 0.5rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SceneManagerDialogComponent {
  protected readonly data = inject<SceneManagerDialogData>(MAT_DIALOG_DATA);
}
