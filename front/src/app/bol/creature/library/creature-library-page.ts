import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCard} from '@angular/material/card';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {CreatureStatblockComponent} from '../statblock/creature-statblock.component';
import {startWith, switchMap} from 'rxjs';
import {CreatureCardComponent, creatureImage} from './creature-card/creature-card.component';

@Component({
  selector: 'creature-statblock-dialog',
  imports: [MatDialogModule, CreatureStatblockComponent],
  template: `<bol-creature-statblock [creature]="data.creature" [imageSrc]="data.imageSrc" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureStatblockDialogContent {
  protected readonly data = inject<{creature: BolCreatureModel; imageSrc: string}>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'bol-creature-library-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatCard,
    DwTagComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
    CreatureCardComponent,
  ],
  templateUrl: './creature-library-page.html',
  styleUrl: './creature-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureLibraryPageComponent {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly dialog = inject(MatDialog);
  private readonly refreshTrigger = signal(0);
  private readonly creatures = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.creaturesService.creatures()),
    ),
    {initialValue: []},
  );

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly searchTerm = signal('');
  protected readonly searchTaille = signal<number | ''>('');
  protected readonly onlyCreations = signal(false);

  protected readonly filteredCreatures = computed(() =>
    [...this.creatures()]
      .filter((creature) => (this.onlyCreations() ? Boolean(creature.user_id) : true))
      .filter((creature) =>
        this.searchTaille() !== ''
          ? Number(creature.id_taille) === Number(this.searchTaille())
          : true,
      )
      .filter((creature) => {
        const term = this.searchTerm().trim().toLocaleLowerCase();
        if (!term) {
          return true;
        }

        return (
          creature.nom.toLocaleLowerCase().includes(term) ||
          (creature.commentaire ?? '').toLocaleLowerCase().includes(term)
        );
      })
      .sort((left, right) => {
        const sizeCompare = Number(left.id_taille) - Number(right.id_taille);
        if (sizeCompare !== 0) {
          return sizeCompare;
        }

        return left.nom.localeCompare(right.nom);
      }),
  );
  protected readonly creatureCount = computed(() => this.filteredCreatures().length);
  protected readonly totalCreatureCount = computed(() => this.creatures().length);

  protected showGroupHeader(index: number): boolean {
    const creatures = this.filteredCreatures();
    return index === 0 || creatures[index - 1].id_taille !== creatures[index].id_taille;
  }

  protected askDelete(creature: BolCreatureModel): void {
    this.dialog
      .open(DwConfirmDialogComponent, {
        data: {
          title: 'Supprimer la créature',
          message: `Voulez-vous supprimer "${creature.nom}" ?`,
          confirmLabel: 'Supprimer',
        },
        width: '380px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deleteCreature(creature);
        }
      });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchTaille.set('');
    this.onlyCreations.set(false);
  }

  protected openStatblock(creature: BolCreatureModel): void {
    this.dialog.open(CreatureStatblockDialogContent, {
      data: {creature, imageSrc: creatureImage(creature)},
      maxWidth: 'min(760px, 92vw)',
      panelClass: 'creature-statblock-dialog',
    });
  }

  private deleteCreature(creature: BolCreatureModel): void {
    if (!creature.id) {
      return;
    }

    this.creaturesService.deleteCreature(creature.id).subscribe({
      next: () => this.refreshTrigger.update((value) => value + 1),
    });
  }
}
