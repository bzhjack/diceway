import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
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
import {HeroStatblockComponent} from '../statblock/hero-statblock.component';
import {HeroCardComponent, heroImage, heroLanguagesText} from './hero-card/hero-card.component';

@Component({
  selector: 'bol-hero-library-page',
  imports: [
    FormsModule,
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
    HeroCardComponent,
  ],
  templateUrl: './hero-library-page.html',
  styleUrl: './hero-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroLibraryPageComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly heroes = refreshableResource(() => this.herosService.heroes());

  protected readonly searchTerm = signal('');
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

  protected askDelete(hero: BolHerosModel): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Supprimer le héros',
        message: `Voulez-vous supprimer "${hero.origines.nom ?? 'ce héros'}" ?`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.deleteHero(hero);
      }
    });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.onlyPending.set(false);
  }

  protected openStatblock(hero: BolHerosModel): void {
    openStatblockDialog(this.dialog, HeroStatblockComponent, {
      hero,
      imageSrc: heroImage(hero),
    });
  }

  private deleteHero(hero: BolHerosModel): void {
    if (!hero.id) {
      return;
    }

    this.herosService.deleteHeros(hero.id).subscribe({
      next: () => this.heroes.refresh(),
      error: (error: unknown) => {
        this.snackBar.open(
          extractApiErrorMessage(error, 'La suppression du héros a échoué.'),
          'Fermer',
          {duration: 5000},
        );
      },
    });
  }
}
