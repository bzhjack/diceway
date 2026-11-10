import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {Observable} from 'rxjs';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {LibraryEnteteComponent} from '../../shared/library/library-entete/library-entete';
import {BolLibraryRowsPageBase} from '../../shared/library/library-rows-page.base';
import {LibraryColonne, LibraryOption} from '../../shared/models/library-rows.model';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';
import {carrieresDe, languesDe} from '../../shared/personnage.util';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {heroStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {heroImage} from '../hero.util';

type Tri = 'nom' | 'joueur' | 'region' | 'statut' | 'vitalite' | 'heroisme';
/** Un héros actif joue ; un héros en cours de création attend d'être activé. */
type Statut = 'tous' | 'actifs' | 'en-cours';

const COLONNES: readonly LibraryColonne<Tri>[] = [
  {cle: 'nom', label: 'Héros'},
  {cle: 'joueur', label: 'Joueur'},
  {cle: 'region', label: 'Région'},
  {cle: 'statut', label: 'Statut'},
  {cle: 'vitalite', label: 'Vit.', titre: 'Vitalité', num: true},
  {cle: 'heroisme', label: 'Hér.', titre: 'Héroïsme', num: true},
  {cle: null, label: 'Carrières'},
];

/**
 * Les héros du compte, en lignes : à gauche les filtres (statut) avec leur nombre de héros, à droite le tableau, triable par
 * colonne. Un clic sur un héros ouvre son statbloc ; chacun se modifie, se supprime, et ceux en cours de création s'éditent en création
 * avancée.
 */
@Component({
  selector: 'bol-hero-library-page',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatCard,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    AvatarFallbackDirective,
    DwCompactBarComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
    DwTagComponent,
    LibraryEnteteComponent,
  ],
  templateUrl: './hero-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroLibraryPageComponent extends BolLibraryRowsPageBase<BolHerosModel, Tri> {
  private readonly herosService = inject(BolHerosService);
  private readonly heroes = refreshableResource(() => this.herosService.heroes());
  protected readonly colonnesDefinies = COLONNES;
  protected readonly deleteTexts: LibraryDeleteTexts<BolHerosModel> = {
    title: 'Supprimer le héros',
    name: (item) => item.origines.nom ?? 'ce héros',
    consequence: 'Il quitte aussi ses compagnies et les tables où il est assis.',
    error: 'La suppression du héros a échoué.',
  };

  /** L'en-tête de la page, que la barre compacte remplace une fois sorti de l'écran. */
  protected readonly entete = viewChild<DwLibraryHeaderComponent, ElementRef<HTMLElement>>(DwLibraryHeaderComponent, {read: ElementRef});

  protected readonly totalHeroCount = computed(() => this.heroes.data().length);

  protected readonly statut = signal<Statut>('tous');
  protected readonly statuts = computed((): LibraryOption<Statut>[] => {
    const heros = this.heroes.data();
    const actifs = heros.filter((h) => h.active).length;
    return [
      {cle: 'tous', label: 'Tous les héros', compte: heros.length},
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
  protected readonly regionField = form(this.searchRegion);

  protected readonly filtresActifs = computed(() => this.statut() !== 'tous' || this.searchRegion() !== '' || this.searchTerm() !== '');

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

  /** Les lignes du tableau : le héros, son portrait, ses carrières. */
  protected readonly lignes = computed(() =>
    this.filteredHeroes().map((hero) => ({hero, nom: this.nomDe(hero), image: heroImage(hero), carrieres: carrieresDe(hero)})),
  );

  protected valeurDeTri(hero: BolHerosModel, cle: Tri): number | string {
    switch (cle) {
      case 'nom':
        return this.nomDe(hero);
      case 'joueur':
        return hero.origines.joueur ?? '';
      case 'region':
        return hero.origines.region?.region ?? '';
      case 'statut':
        return hero.active ? 1 : 0;
      default:
        return hero.ressources[cle];
    }
  }

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
