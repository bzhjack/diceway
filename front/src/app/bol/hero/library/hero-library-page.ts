import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {Observable} from 'rxjs';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {LibraryFondComponent} from '../../shared/library/library-fond/library-fond';
import {LibraryBarreComponent} from '../../shared/library/library-barre/library-barre';
import {LibraryFacetteComponent} from '../../shared/library/library-facette/library-facette';
import {LibrarySegmentsComponent} from '../../shared/library/library-segments/library-segments';
import {TuileComponent} from '../../shared/tuile/tuile';
import {BolLibraryRowsPageBase, compteDit} from '../../shared/library/library-rows-page.base';
import {LibraryOption} from '../../shared/models/library-rows.model';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';
import {carrieresDe, languesDe} from '../../shared/personnage.util';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {heroStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {heroImage} from '../hero.util';

/** Un héros actif joue ; un héros en cours de création attend d'être activé. */
type Statut = 'tous' | 'actifs' | 'en-cours';

/**
 * Les héros du compte, en tuiles : sous l'en-tête, la barre sur une ligne (la recherche, le statut, la région en liste, chaque option
 * avec son nombre de héros), puis une tuile par héros (portrait, nom, joueur ; héroïsme et vitalité dans son pied), par nom. Un clic sur une tuile ouvre son statbloc ; son menu le modifie, le supprime, et l'édite en création avancée tant qu'il
 * est en cours de création (« En cours » sur la tuile).
 */
@Component({
  selector: 'bol-hero-library-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    LibraryBarreComponent,
    LibraryFacetteComponent,
    LibraryFondComponent,
    LibrarySegmentsComponent,
    MatMenuModule,
    TuileComponent,
  ],
  templateUrl: './hero-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroLibraryPageComponent extends BolLibraryRowsPageBase<BolHerosModel> {
  private readonly herosService = inject(BolHerosService);
  private readonly heroes = refreshableResource(() => this.herosService.heroes());
  protected readonly deleteTexts: LibraryDeleteTexts<BolHerosModel> = {
    title: 'Supprimer le héros',
    name: (item) => item.origines.nom ?? 'ce héros',
    consequence: 'Il quitte aussi ses compagnies et les tables où il est assis.',
    error: 'La suppression du héros a échoué.',
  };

  protected readonly totalHeroCount = computed(() => this.heroes.data().length);

  protected readonly statut = signal<Statut>('tous');
  protected readonly statuts = computed((): LibraryOption<Statut>[] => {
    const heros = this.heroes.data();
    const actifs = heros.filter((h) => h.active).length;
    return [
      {cle: 'tous', label: 'Tous', compte: heros.length},
      {cle: 'actifs', label: 'Actifs', compte: actifs},
      {cle: 'en-cours', label: 'En cours de création', compte: heros.length - actifs},
    ];
  });

  /** Les régions des héros, par nom. */
  protected readonly regions = computed(() => {
    const parId = new Map<number, {id: number; nom: string}>();
    for (const hero of this.heroes.data()) {
      const region = hero.origines.region;
      if (region?.id != null) {
        parId.set(region.id, {id: region.id, nom: region.region});
      }
    }
    return [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  });
  protected readonly searchRegion = signal<number | ''>('');

  protected readonly filtresActifs = computed(() => this.statut() !== 'tous' || this.searchRegion() !== '' || this.searchTerm() !== '');

  /** Ce que dit la barre : toutes les fiches, ou celles que les filtres gardent sur le total. */
  protected readonly compte = computed(() => compteDit(this.heroCount(), this.totalHeroCount(), 'héros', 'héros'));

  /** Ce que dit l'en-tête : toutes les fiches. */
  protected readonly total = computed(() => compteDit(this.totalHeroCount(), this.totalHeroCount(), 'héros', 'héros'));

  /** Les régions, en options de leur liste : chacune avec son nombre de héros. */
  protected readonly regionOptions = computed((): LibraryOption<number | ''>[] =>
    this.regions().map((r) => ({cle: r.id, label: r.nom, compte: this.heroes.data().filter((h) => h.origines.region_id === r.id).length})),
  );

  protected readonly filteredHeroes = computed(() => {
    const statut = this.statut();
    const region = this.searchRegion();
    return this.trierLes(
      this.heroes
        .data()
        .filter((h) => statut === 'tous' || (statut === 'actifs') === h.active)
        .filter((h) => region === '' || h.origines.region_id === region)
        .filter((h) =>
          matchesTerm(this.searchTerm(), h.origines.nom, h.origines.joueur, h.origines.commentaire, h.origines.region?.region, languesDe(h), carrieresDe(h)),
        ),
    );
  });
  protected readonly heroCount = computed(() => this.filteredHeroes().length);

  /** Les tuiles : le héros, son nom, son portrait. */
  protected readonly lignes = computed(() =>
    this.filteredHeroes().map((hero) => ({hero, nom: this.nomDe(hero), image: heroImage(hero)})),
  );

  protected nomDe(hero: BolHerosModel): string {
    return hero.origines.nom ?? '';
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchRegion.set('');
    this.statut.set('tous');
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
