import {ChangeDetectionStrategy, Component, OnInit, computed, inject, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule} from '@angular/material/dialog';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
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
  selector: 'hero-statblock-dialog',
  imports: [MatDialogModule, HeroStatblockComponent],
  template: `<bol-hero-statblock [hero]="data.hero" [imageSrc]="data.imageSrc" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroStatblockDialogContent {
  protected readonly data = inject<{hero: BolHerosModel; imageSrc: string}>(MAT_DIALOG_DATA);
}

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
export class HeroLibraryPageComponent implements OnInit {
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly heroes = this.herosService.heroesList;

  ngOnInit(): void {
    this.herosService.loadHeroes();
  }

  protected readonly searchTerm = signal('');
  protected readonly onlyPending = signal(false);

  protected readonly filteredHeroes = computed(() =>
    [...this.heroes()]
      .filter((hero) => (this.onlyPending() ? !hero.active : true))
      .filter((hero) => {
        const term = this.searchTerm().trim().toLocaleLowerCase();
        if (!term) {
          return true;
        }

        const searchValues = [
          hero.origines.nom,
          hero.origines.joueur,
          hero.origines.commentaire,
          hero.origines.region?.region,
          heroLanguagesText(hero),
        ];

        return searchValues.some((value) => value?.toLocaleLowerCase().includes(term));
      })
      .sort((left, right) => {
        if (left.active !== right.active) {
          return left.active ? 1 : -1;
        }

        return (left.origines.nom ?? '').localeCompare(right.origines.nom ?? '');
      }),
  );
  protected readonly heroCount = computed(() => this.filteredHeroes().length);
  protected readonly totalHeroCount = computed(() => this.heroes().length);

  protected askDelete(hero: BolHerosModel): void {
    this.dialog
      .open(DwConfirmDialogComponent, {
        data: {
          title: 'Supprimer le héros',
          message: `Voulez-vous supprimer "${hero.origines.nom ?? 'ce héros'}" ?`,
          confirmLabel: 'Supprimer',
        },
        width: '380px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
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
    this.dialog.open(HeroStatblockDialogContent, {
      data: {hero, imageSrc: heroImage(hero)},
      maxWidth: 'min(760px, 92vw)',
      panelClass: 'hero-statblock-dialog',
    });
  }

  private deleteHero(hero: BolHerosModel): void {
    if (!hero.id) {
      return;
    }

    this.herosService.deleteHeros(hero.id).subscribe({
      next: () => this.herosService.loadHeroes(),
    });
  }
}
