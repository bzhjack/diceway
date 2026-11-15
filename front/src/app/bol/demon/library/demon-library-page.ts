import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {Observable} from 'rxjs';
import {BolDemonModel} from '../../models/bol-demon.model';
import {BolDemonStateService} from '../../services/bol-demon-state.service';
import {BolDemonsService} from '../../services/bol-demons.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {LibraryFacettesComponent} from '../../shared/library/library-facettes/library-facettes';
import {LibraryFondComponent} from '../../shared/library/library-fond/library-fond';
import {LibraryBarreComponent} from '../../shared/library/library-barre/library-barre';
import {LibraryFacetteComponent} from '../../shared/library/library-facette/library-facette';
import {TuileComponent} from '../../shared/tuile/tuile';
import {BolFichesPageBase, compteDit, RANG_LABELS} from '../../shared/library/library-rows-page.base';
import {LibraryOption, LibraryRang} from '../../shared/models/library-rows.model';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {demonStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {demonImage} from '../demon.util';

/**
 * Les démons, en tuiles : sous l'en-tête, la barre sur une ligne (la recherche, la source, puis le scénario, le rang et la catégorie en
 * listes, chaque option avec son nombre de démons), puis une tuile par démon (portrait, nom, rang, vitalité), par nom. Un
 * clic sur une tuile ouvre son statbloc ; les fiches du compte portent « Mes fiches » et un menu pour les modifier ou les supprimer,
 * celles du catalogue commun sont en lecture seule.
 */
@Component({
  selector: 'bol-demon-library-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    LibraryFacettesComponent,
    LibraryBarreComponent,
    LibraryFacetteComponent,
    LibraryFondComponent,
    TuileComponent,
  ],
  templateUrl: './demon-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonLibraryPageComponent extends BolFichesPageBase<BolDemonModel> {
  private readonly demonStateService = inject(BolDemonStateService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly demons = refreshableResource(() => this.demonsService.demons());
  protected readonly fiches = this.demons.data;
  protected readonly deleteTexts: LibraryDeleteTexts<BolDemonModel> = {
    title: 'Supprimer le démon',
    name: (item) => item.nom,
    consequence: 'Cette fiche quitte aussi les scènes qui la citent ; les tables où elle est posée gardent leur copie.',
    error: 'La suppression du démon a échoué.',
  };

  protected readonly categories = this.demonStateService.categorieList;
  protected readonly searchCategorie = signal<number | ''>('');

  protected readonly filtresActifs = computed(() => this.facettesActives() || this.searchCategorie() !== '' || this.searchTerm() !== '');

  /** Ce que dit la barre : toutes les fiches, ou celles que les filtres gardent sur le total. */
  protected readonly compte = computed(() => compteDit(this.demonCount(), this.totalCount(), 'démon', 'démons'));

  /** Ce que dit l'en-tête : toutes les fiches. */
  protected readonly total = computed(() => compteDit(this.totalCount(), this.totalCount(), 'démon', 'démons'));

  /** Les catégories, en options de leur liste : chacune avec son nombre de démons (une catégorie sans démon est tue, sauf choisie). */
  protected readonly categorieOptions = computed((): LibraryOption<number | ''>[] =>
    (this.categories() ?? [])
      .map((c) => ({cle: c.id, label: c.categorie, compte: this.fiches().filter((d) => d.id_categorie === c.id).length}))
      .filter((o) => o.compte > 0 || o.cle === this.searchCategorie()),
  );

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
