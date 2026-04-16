import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {BolCreatureModel} from '../models/bol-creature.model';
import {BolCreatureStateService} from '../services/bol-creature-state.service';
import {BolCreaturesService} from '../services/bol-creatures.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';

@Component({
  selector: 'bol-creature-library-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './creature-library-page.html',
  styleUrl: './creature-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureLibraryPageComponent {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly creatures = toSignal(this.creaturesService.creatures(), { initialValue: [] });

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly searchTerm = signal('');
  protected readonly searchTaille = signal<number | null>(null);
  protected readonly onlyCreations = signal(false);

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
}
