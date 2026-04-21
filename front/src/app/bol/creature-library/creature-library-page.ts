import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ConfirmationService} from 'primeng/api';
import {BolCreatureModel} from '../models/bol-creature.model';
import {BolCreatureStateService} from '../services/bol-creature-state.service';
import {BolCreaturesService} from '../services/bol-creatures.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {DialogModule} from 'primeng/dialog';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import {startWith, switchMap} from 'rxjs';
import {CreatureStatblockComponent} from '../creature-statblock/creature-statblock.component';

@Component({
  selector: 'bol-creature-library-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmPopupModule,
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TableModule,
    TooltipModule,
    CreatureStatblockComponent,
  ],
  templateUrl: './creature-library-page.html',
  styleUrl: './creature-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class CreatureLibraryPageComponent {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly refreshTrigger = signal(0);
  private readonly creatures = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.creaturesService.creatures()),
    ),
    { initialValue: [] },
  );

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly searchTerm = signal('');
  protected readonly searchTaille = signal<number | null>(null);
  protected readonly onlyCreations = signal(false);
  protected readonly inspectedCreature = signal<BolCreatureModel | null>(null);

  protected readonly filteredCreatures = computed(() =>
    [...this.creatures()]
      .filter((creature) =>
        this.onlyCreations() ? Boolean(creature.user_id) : true,
      )
      .filter((creature) =>
        this.searchTaille() !== null ? Number(creature.id_taille) === Number(this.searchTaille()) : true,
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

  protected askDelete(event: Event, creature: BolCreatureModel): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous supprimer cette creature ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.deleteCreature(creature),
    });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchTaille.set(null);
    this.onlyCreations.set(false);
  }

  protected creatureImage(creature: BolCreatureModel): string {
    if (!creature.user_id) {
      return `/assets/bol/bestiary/${creature.id}.jpg`;
    }

    return creature.avatar || '/assets/bol/empty-avatar.jpg';
  }

  protected openStatblock(creature: BolCreatureModel): void {
    this.inspectedCreature.set(creature);
  }

  protected onStatblockVisibilityChange(visible: boolean): void {
    if (!visible) {
      this.inspectedCreature.set(null);
    }
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
