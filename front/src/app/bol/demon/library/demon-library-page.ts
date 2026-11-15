import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Observable} from 'rxjs';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {LibraryFacettesComponent} from '../../shared/library/library-facettes/library-facettes';
import {LibraryRangComponent} from '../../shared/library/library-rang/library-rang';
import {LibraryColonneComponent} from '../../shared/library/library-colonne/library-colonne';
import {LibraryFondComponent} from '../../shared/library/library-fond/library-fond';
import {LibraryTriComponent} from '../../shared/library/library-tri/library-tri';
import {TuileComponent} from '../../shared/tuile/tuile';
import {BolFichesPageBase, compteDit, ORDRE_DES_RANGS, RANG_LABELS} from '../../shared/library/library-rows-page.base';
import {LibraryPastille, LibraryRang, LibraryTriOption} from '../../shared/models/library-rows.model';
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
    MatFormFieldModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
    LibraryFacettesComponent,
    LibraryRangComponent,
    LibraryColonneComponent,
    LibraryFondComponent,
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


  protected readonly categories = this.demonStateService.categorieList;
  protected readonly searchCategorie = signal<number | ''>('');
  protected readonly categorieField = form(this.searchCategorie);

  protected readonly filtresActifs = computed(() => this.facettesActives() || this.searchCategorie() !== '' || this.searchTerm() !== '');

  /** Ce que dit la colonne : toutes les fiches, ou celles que les filtres gardent sur le total. */
  protected readonly compte = computed(() => compteDit(this.demonCount(), this.totalCount(), 'démon', 'démons'));

  /** Les filtres posés, en pastilles au-dessus des tuiles : un clic sur l'une le retire. */
  protected readonly pastilles = computed((): LibraryPastille[] => [
      ...this.pastillesDesFacettes(),
      ...(this.searchCategorie() === ''
        ? []
        : [{label: this.categories()?.find((c) => c.id === this.searchCategorie())?.categorie ?? 'Catégorie', retirer: () => this.searchCategorie.set('')}]),
      ...this.pastilleDeRecherche(),
  ]);

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
