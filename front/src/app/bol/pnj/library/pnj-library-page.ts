import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {Observable} from 'rxjs';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolPnjService} from '../../services/bol-pnj.service';
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
import {carrieresDe, languesDe} from '../../shared/personnage.util';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {pnjStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {pnjImage} from '../pnj.util';

/**
 * Les PNJ, en tuiles : sous l'en-tête, la barre sur une ligne (la recherche, la source, puis le scénario, le rang et la région en
 * listes, chaque option avec son nombre de PNJ), puis une tuile par PNJ (portrait, nom, rang, vitalité), par nom. Un clic sur une
 * tuile ouvre son statbloc ; les fiches du compte portent « Mes fiches » et un menu pour les modifier ou les supprimer, celles du
 * catalogue commun sont en lecture seule.
 */
@Component({
  selector: 'bol-pnj-library-page',
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
  templateUrl: './pnj-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjLibraryPageComponent extends BolFichesPageBase<BolHerosModel> {
  private readonly pnjService = inject(BolPnjService);
  private readonly pnjs = refreshableResource(() => this.pnjService.pnjs());
  protected readonly fiches = this.pnjs.data;
  protected readonly deleteTexts: LibraryDeleteTexts<BolHerosModel> = {
    title: 'Supprimer le PNJ',
    name: (item) => item.origines.nom ?? 'ce PNJ',
    consequence: 'Cette fiche quitte aussi les scènes qui la citent ; les tables où elle est posée gardent leur copie.',
    error: 'La suppression du PNJ a échoué.',
  };

  /** Les régions des PNJ, par nom. */
  protected readonly regions = computed(() => {
    const parId = new Map<number, {id: number; nom: string}>();
    for (const pnj of this.fiches()) {
      const region = pnj.origines.region;
      if (region?.id != null) {
        parId.set(region.id, {id: region.id, nom: region.region});
      }
    }
    return [...parId.values()].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  });
  protected readonly searchRegion = signal<number | ''>('');

  protected readonly filtresActifs = computed(() => this.facettesActives() || this.searchRegion() !== '' || this.searchTerm() !== '');

  /** Ce que dit la barre : toutes les fiches, ou celles que les filtres gardent sur le total. */
  protected readonly compte = computed(() => compteDit(this.pnjCount(), this.totalCount(), 'PNJ', 'PNJ'));

  /** Ce que dit l'en-tête : toutes les fiches. */
  protected readonly total = computed(() => compteDit(this.totalCount(), this.totalCount(), 'PNJ', 'PNJ'));

  /** Les régions, en options de leur liste : chacune avec son nombre de PNJ. */
  protected readonly regionOptions = computed((): LibraryOption<number | ''>[] =>
    this.regions().map((r) => ({cle: r.id, label: r.nom, compte: this.fiches().filter((p) => p.origines.region_id === r.id).length})),
  );

  protected readonly filteredPnjs = computed(() => {
    const region = this.searchRegion();
    return this.trierLes(
      this.filtrerParFacettes(this.fiches())
        .filter((p) => region === '' || p.origines.region_id === region)
        .filter((p) =>
          matchesTerm(
            this.searchTerm(),
            p.origines.nom,
            p.origines.commentaire,
            p.origines.region?.region,
            languesDe(p),
            carrieresDe(p),
            ...this.titresDesScenarios(p),
          ),
        ),
    );
  });
  protected readonly pnjCount = computed(() => this.filteredPnjs().length);

  /** Les tuiles : le PNJ, son nom, son portrait, le nom de son rang, s'il est au compte. */
  protected readonly lignes = computed(() =>
    this.filteredPnjs().map((pnj) => {
      const rang = this.rangDe(pnj);
      return {
        pnj,
        nom: this.nomDe(pnj),
        image: pnjImage(pnj),
        rangLabel: RANG_LABELS[rang],
        mien: Boolean(pnj.user_id),
      };
    }),
  );

  protected rangDe(pnj: BolHerosModel): LibraryRang {
    return pnj.type === 'R' || pnj.type === 'P' ? pnj.type : 'C';
  }

  protected nomDe(pnj: BolHerosModel): string {
    return pnj.origines.nom ?? '';
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchRegion.set('');
    this.effacerFacettes();
  }

  protected openStatblock(pnj: BolHerosModel): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {
      data: pnjStatblockData(pnj),
      imageSrc: pnjImage(pnj),
    });
  }

  protected deleteItem(id: NonNullable<BolHerosModel['id']>): Observable<unknown> {
    return this.pnjService.deletePnj(id);
  }

  protected refreshItems(): void {
    this.pnjs.refresh();
  }
}
