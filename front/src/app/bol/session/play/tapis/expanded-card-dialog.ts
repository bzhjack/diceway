import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NavigationStart, Router} from '@angular/router';
import {filter} from 'rxjs';
import {ExpandedCardDialogData} from '../../models/expanded-card-dialog.model';
import {ExpandedCardComponent} from './expanded-card';

/** La carte d'un personnage, ouverte en dialogue : héros (jet d'action, fiche) ou PNJ, créature, démon (statbloc).
 * Elle montre ce que la page lui donne et lui remonte chaque action ; elle se ferme d'elle-même quand la carte
 * quitte la table. */
@Component({
  selector: 'bol-expanded-card-dialog',
  imports: [ExpandedCardComponent],
  template: `
    @if (data.card(); as card) {
      <bol-expanded-card
        [card]="card"
        [sessionId]="data.sessionId"
        [hero]="data.hero()"
        [statblock]="data.statblock()"
        [returnUrl]="data.returnUrl()"
        [mode]="data.mode()"
        [canAttack]="data.canAttack()"
        (closed)="ref.close()"
        (changed)="data.changed()"
        (removeRequested)="data.remove($event)"
        (armureToggled)="data.toggleArmure({card, armureId: $event})"
        (armeToggled)="data.toggleArme({card, armeId: $event})"
        (attackRequested)="ref.close(); data.attack($event)"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedCardDialogComponent {
  protected readonly data = inject<ExpandedCardDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<ExpandedCardDialogComponent>);

  constructor() {
    // « Modifier la fiche » (ou tout autre lien de la carte) quitte la page : le dialogue se ferme avec elle.
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.ref.close());
    effect(() => {
      if (this.data.card() === null) {
        this.ref.close();
      }
    });
  }
}
