import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatCard} from '@angular/material/card';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {heroStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {HeroCardComponent, heroImage, heroLanguagesText} from './hero-card/hero-card.component';
import {Observable} from 'rxjs';
import {DwLibraryGridComponent} from '../../../shared/dw-library-grid/dw-library-grid';
import {BolLibraryPageBase} from '../../shared/library/library-page.base';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';

@Component({
  selector: 'bol-hero-library-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatCard,
    DwTagComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
    DwLibraryGridComponent,
    HeroCardComponent,
  ],
  templateUrl: './hero-library-page.html',
  styleUrl: './hero-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroLibraryPageComponent extends BolLibraryPageBase<BolHerosModel> {
  private readonly herosService = inject(BolHerosService);
  private readonly heroes = refreshableResource(() => this.herosService.heroes());
  protected readonly deleteTexts: LibraryDeleteTexts<BolHerosModel> = {
    title: 'Supprimer le héros',
    name: (item) => item.origines.nom ?? 'ce héros',
    error: 'La suppression du héros a échoué.',
  };

  protected readonly onlyPending = signal(false);

  protected readonly filteredHeroes = computed(() =>
    [...this.heroes.data()]
      .filter((hero) => (this.onlyPending() ? !hero.active : true))
      .filter((hero) =>
        matchesTerm(
          this.searchTerm(),
          hero.origines.nom,
          hero.origines.joueur,
          hero.origines.commentaire,
          hero.origines.region?.region,
          heroLanguagesText(hero),
        ),
      )
      .sort((left, right) => {
        if (left.active !== right.active) {
          return left.active ? 1 : -1;
        }

        return (left.origines.nom ?? '').localeCompare(right.origines.nom ?? '');
      }),
  );
  protected readonly heroCount = computed(() => this.filteredHeroes().length);
  protected readonly totalHeroCount = computed(() => this.heroes.data().length);

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.onlyPending.set(false);
  }

  protected openStatblock(hero: BolHerosModel): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {
      data: heroStatblockData(hero),
      imageSrc: heroImage(hero),
      kind: 'hero',
    });
  }

  protected deleteItem(id: NonNullable<BolHerosModel['id']>): Observable<unknown> {
    return this.herosService.deleteHeros(id);
  }

  protected refreshItems(): void {
    this.heroes.refresh();
  }
}
