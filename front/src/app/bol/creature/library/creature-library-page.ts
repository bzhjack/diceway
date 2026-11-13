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
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
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
import {creatureStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {creatureImage} from '../creature.util';

type Tri = 'nom' | 'type' | 'vitalite' | 'taille';

const OPTIONS_DE_TRI: readonly LibraryTriOption<Tri>[] = [
  {cle: 'nom', label: 'Nom'},
  {cle: 'type', label: 'Rang'},
  {cle: 'vitalite', label: 'Vitalité'},
  {cle: 'taille', label: 'Taille'},
];

/**
 * Le bestiaire, en tuiles : à gauche les filtres (source, scénario) avec leur nombre de créatures, à droite une tuile par créature
 * (portrait, nom, rang, vitalité), triées par la liste « Trier par ». Un clic sur une tuile ouvre son statbloc ; les fiches du compte
 * portent « Mes fiches » et un menu pour les modifier ou les supprimer, celles du catalogue commun sont en lecture seule.
 */
@Component({
  selector: 'bol-creature-library-page',
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
  templateUrl: './creature-library-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureLibraryPageComponent extends BolFichesPageBase<BolCreatureModel, Tri> {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly creatures = refreshableResource(() => this.creaturesService.creatures());
  protected readonly fiches = this.creatures.data;
  protected readonly libelleTout = 'Tout le bestiaire';
  protected readonly optionsDeTri = OPTIONS_DE_TRI;
  protected readonly deleteTexts: LibraryDeleteTexts<BolCreatureModel> = {
    title: 'Supprimer la créature',
    name: (item) => item.nom,
    consequence: 'Cette fiche quitte aussi les scènes qui la citent ; les tables où elle est posée gardent leur copie.',
    error: 'La suppression de la créature a échoué.',
  };

  /** L'en-tête de la page, que la barre compacte remplace une fois sorti de l'écran. */
  protected readonly entete = viewChild<DwLibraryHeaderComponent, ElementRef<HTMLElement>>(DwLibraryHeaderComponent, {read: ElementRef});

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly searchTaille = signal<number | ''>('');
  protected readonly tailleField = form(this.searchTaille);

  protected readonly filtresActifs = computed(() => this.facettesActives() || this.searchTaille() !== '' || this.searchTerm() !== '');

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

  protected valeurDeTri(creature: BolCreatureModel, cle: Tri): number | string {
    switch (cle) {
      case 'nom':
        return creature.nom;
      case 'taille':
        return creature.id_taille;
      case 'type':
        return ORDRE_DES_RANGS[this.rangDe(creature)];
      default:
        return creature[cle];
    }
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
