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
import {BolPnjService} from '../../services/bol-pnj.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwCompactBarComponent} from '../../../shared/dw-compact-bar/dw-compact-bar';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {LibraryEnteteComponent} from '../../shared/library/library-entete/library-entete';
import {LibraryFacettesComponent} from '../../shared/library/library-facettes/library-facettes';
import {LibraryRangComponent} from '../../shared/library/library-rang/library-rang';
import {BolFichesPageBase, ORDRE_DES_RANGS, RANG_LABELS} from '../../shared/library/library-rows-page.base';
import {LibraryColonne, LibraryRang} from '../../shared/models/library-rows.model';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';
import {carrieresDe, languesDe} from '../../shared/personnage.util';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {pnjStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {pnjImage} from '../pnj.util';

type Tri = 'nom' | 'region' | 'type' | 'vitalite' | 'melee' | 'defense';

const COLONNES: readonly LibraryColonne<Tri>[] = [
  {cle: 'nom', label: 'PNJ'},
  {cle: 'region', label: 'Région'},
  {cle: 'type', label: 'Type'},
  {cle: 'vitalite', label: 'Vit.', titre: 'Vitalité', num: true},
  {cle: 'melee', label: 'Mêlée', num: true},
  {cle: 'defense', label: 'Déf.', titre: 'Défense', num: true},
  {cle: null, label: 'Carrières'},
  {cle: null, label: 'Source'},
];

/**
 * Les PNJ, en lignes : à gauche les filtres (source, scénario) avec leur nombre de PNJ, à droite le tableau, triable par colonne, sous la
 * recherche suivie de deux listes (rang, région).
 * Un clic sur un PNJ ouvre son statbloc ; les fiches du compte se modifient et se suppriment, celles du catalogue commun sont
 * en lecture seule.
 */
@Component({
  selector: 'bol-pnj-library-page',
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
    LibraryFacettesComponent,
    LibraryRangComponent,
  ],
  templateUrl: './pnj-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjLibraryPageComponent extends BolFichesPageBase<BolHerosModel, Tri> {
  private readonly pnjService = inject(BolPnjService);
  private readonly pnjs = refreshableResource(() => this.pnjService.pnjs());
  protected readonly fiches = this.pnjs.data;
  protected readonly libelleTout = 'Tous les PNJ';
  protected readonly colonnesDefinies = COLONNES;
  protected readonly deleteTexts: LibraryDeleteTexts<BolHerosModel> = {
    title: 'Supprimer le PNJ',
    name: (item) => item.origines.nom ?? 'ce PNJ',
    consequence: 'Cette fiche quitte aussi les scènes qui la citent ; les tables où elle est posée gardent leur copie.',
    error: 'La suppression du PNJ a échoué.',
  };

  /** L'en-tête de la page, que la barre compacte remplace une fois sorti de l'écran. */
  protected readonly entete = viewChild<DwLibraryHeaderComponent, ElementRef<HTMLElement>>(DwLibraryHeaderComponent, {read: ElementRef});

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
  protected readonly regionField = form(this.searchRegion);

  protected readonly filtresActifs = computed(() => this.facettesActives() || this.searchRegion() !== '' || this.searchTerm() !== '');

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

  /** Les lignes du tableau : le PNJ, son portrait, son rang, ses carrières, ses scénarios avec leur teinte, s'il est au compte. */
  protected readonly lignes = computed(() =>
    this.filteredPnjs().map((pnj) => {
      const rang = this.rangDe(pnj);
      return {
        pnj,
        nom: this.nomDe(pnj),
        image: pnjImage(pnj),
        rang,
        rangLabel: RANG_LABELS[rang],
        carrieres: carrieresDe(pnj),
        mien: Boolean(pnj.user_id),
        scenarios: this.scenariosDe(pnj),
      };
    }),
  );

  protected rangDe(pnj: BolHerosModel): LibraryRang {
    return pnj.type === 'R' || pnj.type === 'P' ? pnj.type : 'C';
  }

  protected valeurDeTri(pnj: BolHerosModel, cle: Tri): number | string {
    switch (cle) {
      case 'nom':
        return this.nomDe(pnj);
      case 'region':
        return pnj.origines.region?.region ?? '';
      case 'type':
        return ORDRE_DES_RANGS[this.rangDe(pnj)];
      case 'vitalite':
        return pnj.ressources.vitalite;
      default:
        return pnj.combat[cle];
    }
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
