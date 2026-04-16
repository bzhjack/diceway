import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {BolDemonModel} from '../models/bol-demon.model';
import {BolDemonStateService} from '../services/bol-demon-state.service';
import {BolDemonsService} from '../services/bol-demons.service';
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
  selector: 'bol-demon-library-page',
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
  templateUrl: './demon-library-page.html',
  styleUrl: './demon-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonLibraryPageComponent {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly demons = toSignal(this.demonsService.demons(), { initialValue: [] });

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly searchTerm = signal('');
  protected readonly searchCategorie = signal<number | null>(null);
  protected readonly onlyCreations = signal(false);

  protected readonly filteredDemons = computed(() =>
    [...this.demons()]
      .filter((demon) => (this.onlyCreations() ? Boolean(demon.user_id) : true))
      .filter((demon) =>
        this.searchCategorie() !== null
          ? Number(demon.id_categorie) === Number(this.searchCategorie())
          : true,
      )
      .filter((demon) => {
        const term = this.searchTerm().trim().toLocaleLowerCase();
        if (!term) {
          return true;
        }

        return (
          demon.nom.toLocaleLowerCase().includes(term) ||
          (demon.commentaire ?? '').toLocaleLowerCase().includes(term)
        );
      })
      .sort((left, right) => {
        const categoryCompare = Number(left.id_categorie) - Number(right.id_categorie);
        if (categoryCompare !== 0) {
          return categoryCompare;
        }

        return left.nom.localeCompare(right.nom);
      }),
  );
  protected readonly demonCount = computed(() => this.filteredDemons().length);
  protected readonly totalDemonCount = computed(() => this.demons().length);

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchCategorie.set(null);
    this.onlyCreations.set(false);
  }

  protected demonImage(demon: BolDemonModel): string {
    if (!demon.user_id) {
      return `/assets/bol/demon/${demon.id}.jpg`;
    }

    return demon.avatar || '/assets/bol/empty-avatar.jpg';
  }
}
