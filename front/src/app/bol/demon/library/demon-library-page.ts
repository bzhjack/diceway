import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {Observable} from 'rxjs';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {LibraryFacettesComponent} from '../../shared/library/library-facettes/library-facettes';
import {LibraryRangComponent} from '../../shared/library/library-rang/library-rang';
import {LibraryTriComponent} from '../../shared/library/library-tri/library-tri';
import {TuileComponent} from '../../shared/tuile/tuile';
import {BolFichesPageBase, ORDRE_DES_RANGS, RANG_LABELS} from '../../shared/library/library-rows-page.base';
import {LibraryRang, LibraryTriOption} from '../../shared/models/library-rows.model';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {demonStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {demonImage} from '../demon.util';

type Tri = 'nom' | 'type' | 'vitalite' | 'categorie';

const OPTIONS_DE_TRI: readonly LibraryTriOption<Tri>[] = [
  {cle: 'nom', label: 'Nom'},
  {cle: 'type', label: 'Rang'},
  {cle: 'vitalite', label: 'Vitalité'},
  {cle: 'categorie', label: 'Catégorie'},
];

/**
 * Les démons, en tuiles : à gauche les filtres (source, scénario) avec leur nombre de démons, à droite une tuile par démon (portrait,
 * nom, rang, vitalité), triées par la liste « Trier par ». Un clic sur une tuile ouvre son statbloc ; les fiches du compte portent
 * « Mes fiches » et un menu pour les modifier ou les supprimer, celles du catalogue commun sont en lecture seule.
 */
@Component({
  selector: 'bol-demon-library-page',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatCard,
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    DwCompactBarComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
    DwTagComponent,
    LibraryFacettesComponent,
    LibraryRangComponent,
    LibraryTriComponent,
    TuileComponent,
  ],
  templateUrl: './demon-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonLibraryPageComponent extends BolFichesPageBase<BolDemonModel, Tri> {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly demons = refreshableResource(() => this.demonsService.demons());
  protected readonly fiches = this.demons.data;
  protected readonly libelleTout = 'Tous les démons';
  protected readonly optionsDeTri = OPTIONS_DE_TRI;
  protected readonly deleteTexts: LibraryDeleteTexts<BolDemonModel> = {
    title: 'Supprimer le démon',
    name: (item) => item.nom,
    consequence: 'Cette fiche quitte aussi les scènes qui la citent ; les tables où elle est posée gardent leur copie.',
    error: 'La suppression du démon a échoué.',
  };

  /** L'en-tête de la page, que la barre compacte remplace une fois sorti de l'écran. */
  protected readonly entete = viewChild<DwLibraryHeaderComponent, ElementRef<HTMLElement>>(DwLibraryHeaderComponent, {read: ElementRef});

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly searchCategorie = signal<number | ''>('');
  protected readonly categorieField = form(this.searchCategorie);

  protected readonly filtresActifs = computed(() => this.facettesActives() || this.searchCategorie() !== '' || this.searchTerm() !== '');

  protected readonly filteredDemons = computed(() => {
    const categorie = this.searchCategorie();
    return this.trierLes(
      this.filtrerParFacettes(this.fiches())
        .filter((d) => categorie === '' || d.id_categorie === categorie)
        .filter((d) => matchesTerm(this.searchTerm(), d.nom, d.commentaire, ...d.pouvoirs.map((p) => p.pouvoir.pouvoir), ...this.titresDesScenarios(d))),
    );
  });
  protected readonly demonCount = computed(() => this.filteredDemons().length);

  /** Les tuiles : le démon, son portrait, le nom de son rang, s'il est au compte. */
  protected readonly lignes = computed(() =>
    this.filteredDemons().map((demon) => {
      const rang = this.rangDe(demon);
      return {
        demon,
        image: demonImage(demon),
        rangLabel: RANG_LABELS[rang],
        mien: Boolean(demon.user_id),
      };
    }),
  );

  protected rangDe(demon: BolDemonModel): LibraryRang {
    return demon.categorie?.type ?? 'C';
  }

  protected valeurDeTri(demon: BolDemonModel, cle: Tri): number | string {
    switch (cle) {
      case 'nom':
        return demon.nom;
      case 'categorie':
        return demon.id_categorie;
      case 'type':
        return ORDRE_DES_RANGS[this.rangDe(demon)];
      case 'vitalite':
        return demon.vitalite;
    }
  }

  protected nomDe(demon: BolDemonModel): string {
    return demon.nom;
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchCategorie.set('');
    this.effacerFacettes();
  }

  protected openStatblock(demon: BolDemonModel): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {
      data: demonStatblockData(demon),
      imageSrc: demonImage(demon),
    });
  }

  protected deleteItem(id: NonNullable<BolDemonModel['id']>): Observable<unknown> {
    return this.demonsService.deleteDemon(id);
  }

  protected refreshItems(): void {
    this.demons.refresh();
  }
}
