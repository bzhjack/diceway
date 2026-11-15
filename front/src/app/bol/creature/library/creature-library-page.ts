import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {Observable} from 'rxjs';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
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
import {creatureStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {creatureImage} from '../creature.util';

/**
 * Le bestiaire, en tuiles : sous l'en-tête, la barre sur une ligne (la recherche, la source, puis le scénario, le rang et la taille en
 * listes, chaque option avec son nombre de créatures), puis une tuile par créature (portrait, nom, rang, vitalité), par nom.
 * Un clic sur une tuile ouvre son statbloc ; les fiches du compte portent « Mes fiches » et un menu pour les modifier ou les supprimer,
 * celles du catalogue commun sont en lecture seule.
 */
@Component({
  selector: 'bol-creature-library-page',
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
  templateUrl: './creature-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureLibraryPageComponent extends BolFichesPageBase<BolCreatureModel> {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly creatures = refreshableResource(() => this.creaturesService.creatures());
  protected readonly fiches = this.creatures.data;
  protected readonly deleteTexts: LibraryDeleteTexts<BolCreatureModel> = {
    title: 'Supprimer la créature',
    name: (item) => item.nom,
    consequence: 'Cette fiche quitte aussi les scènes qui la citent ; les tables où elle est posée gardent leur copie.',
    error: 'La suppression de la créature a échoué.',
  };

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly searchTaille = signal<number | ''>('');

  protected readonly filtresActifs = computed(() => this.facettesActives() || this.searchTaille() !== '' || this.searchTerm() !== '');

  /** Ce que dit la barre : toutes les fiches, ou celles que les filtres gardent sur le total. */
  protected readonly compte = computed(() => compteDit(this.creatureCount(), this.totalCount(), 'créature', 'créatures'));

  /** Ce que dit l'en-tête : toutes les fiches. */
  protected readonly total = computed(() => compteDit(this.totalCount(), this.totalCount(), 'créature', 'créatures'));

  /** Les tailles, en options de leur liste : chacune avec son nombre de créatures (une taille sans créature est tue, sauf choisie). */
  protected readonly tailleOptions = computed((): LibraryOption<number | ''>[] =>
    (this.tailles() ?? [])
      .map((t) => ({cle: t.id, label: t.taille, compte: this.fiches().filter((c) => c.id_taille === t.id).length}))
      .filter((o) => o.compte > 0 || o.cle === this.searchTaille()),
  );

  protected readonly filteredCreatures = computed(() => {
    const taille = this.searchTaille();
    return this.trierLes(
      this.filtrerParFacettes(this.fiches())
        .filter((c) => taille === '' || c.id_taille === taille)
        .filter((c) =>
          matchesTerm(this.searchTerm(), c.nom, c.commentaire, ...c.capacites.map((k) => k.capacite.capacite), ...this.titresDesScenarios(c)),
        ),
    );
  });
  protected readonly creatureCount = computed(() => this.filteredCreatures().length);

  /** Les tuiles : la créature, son portrait, le nom de son rang, si elle est au compte. */
  protected readonly lignes = computed(() =>
    this.filteredCreatures().map((creature) => ({
      creature,
      image: creatureImage(creature),
      rangLabel: RANG_LABELS[this.rangDe(creature)],
      mienne: Boolean(creature.user_id),
    })),
  );

  protected rangDe(creature: BolCreatureModel): LibraryRang {
    return creature.taille?.type ?? 'C';
  }

  protected nomDe(creature: BolCreatureModel): string {
    return creature.nom;
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchTaille.set('');
    this.effacerFacettes();
  }

  protected openStatblock(creature: BolCreatureModel): void {
    openStatblockDialog(this.dialog, BolStatblockComponent, {
      data: creatureStatblockData(creature),
      imageSrc: creatureImage(creature),
    });
  }

  protected deleteItem(id: NonNullable<BolCreatureModel['id']>): Observable<unknown> {
    return this.creaturesService.deleteCreature(id);
  }

  protected refreshItems(): void {
    this.creatures.refresh();
  }
}
