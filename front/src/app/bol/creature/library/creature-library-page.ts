import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {RouterLink} from '@angular/router';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {openStatblockDialog} from '../../../shared/dw-statblock-dialog/dw-statblock-dialog';
import {matchesTerm} from '../../../shared/list.utils';
import {refreshableResource} from '../../../shared/refreshable-resource';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {MatCard} from '@angular/material/card';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {DwLibraryHeaderComponent} from '../../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../../shared/dw-library-toolbar/dw-library-toolbar';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {BolStatblockComponent} from '../../shared/statblock/bol-statblock.component';
import {creatureStatblockData} from '../../shared/statblock/bol-statblock.builders';
import {creatureImage} from './creature-card/creature-card.component';
import {Observable} from 'rxjs';
import {BolLibraryPageBase} from '../../shared/library/library-page.base';
import {LibraryDeleteTexts} from '../../shared/models/library-page.model';

/** D'où vient une créature : le catalogue commun (partagé, en lecture seule) ou les fiches du compte. */
type Source = 'tout' | 'catalogue' | 'miennes';
/** Le rang d'une créature, donné par sa taille. */
type Rang = 'R' | 'C' | 'P';
type Tri = 'nom' | 'taille' | 'vitalite' | 'attaque' | 'defense' | 'capacites';

const RANGS: readonly {cle: Rang; label: string}[] = [
  {cle: 'R', label: 'Rival'},
  {cle: 'C', label: 'Coriace'},
  {cle: 'P', label: 'Piétaille'},
];

const COLONNES: readonly {cle: Tri | null; label: string; num?: boolean}[] = [
  {cle: 'nom', label: 'Créature'},
  {cle: 'taille', label: 'Taille'},
  {cle: 'vitalite', label: 'Vit.', num: true},
  {cle: 'attaque', label: 'Att.', num: true},
  {cle: 'defense', label: 'Déf.', num: true},
  {cle: null, label: 'Dégâts'},
  {cle: null, label: 'Protection'},
  {cle: 'capacites', label: 'Capacités', num: true},
  {cle: null, label: 'Source'},
];

/** Couleurs des sagas (`dw-saga--1` à `--4`), comme sur l'accueil : dans l'ordre alphabétique de leur titre. 0 : un one shot. */
const TEINTES = 4;

function rangDe(creature: BolCreatureModel): Rang {
  return creature.taille?.type ?? 'C';
}

function valeurDeTri(creature: BolCreatureModel, tri: Tri): number | string {
  switch (tri) {
    case 'nom':
      return creature.nom;
    case 'taille':
      return creature.id_taille;
    case 'capacites':
      return creature.capacites.length;
    default:
      return creature[tri];
  }
}

/**
 * Le bestiaire, en lignes : à gauche les filtres (source, scénario, rang, taille) avec leur nombre de créatures, à droite le tableau,
 * triable par colonne. Un clic sur une créature ouvre son statbloc ; les fiches du compte se modifient et se suppriment, celles du
 * catalogue commun sont en lecture seule.
 */
@Component({
  selector: 'bol-creature-library-page',
  imports: [
    FormField,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatCard,
    DwTagComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
    AvatarFallbackDirective,
  ],
  templateUrl: './creature-library-page.html',
  styleUrl: './creature-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureLibraryPageComponent extends BolLibraryPageBase<BolCreatureModel> {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly creatures = refreshableResource(() => this.creaturesService.creatures());
  protected readonly deleteTexts: LibraryDeleteTexts<BolCreatureModel> = {
    title: 'Supprimer la créature',
    name: (item) => item.nom,
    consequence: 'Cette fiche quitte aussi les scènes qui la citent ; les tables où elle est posée gardent leur copie.',
    error: 'La suppression de la créature a échoué.',
  };

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly searchTaille = signal<number | ''>('');
  protected readonly tailleField = form(this.searchTaille);
  protected readonly source = signal<Source>('tout');
  protected readonly scenarioId = signal<string | null>(null);
  protected readonly rang = signal<Rang | null>(null);
  protected readonly tri = signal<{cle: Tri; croissant: boolean}>({cle: 'nom', croissant: true});

  protected readonly totalCreatureCount = computed(() => this.creatures.data().length);

  /** Les trois sources, chacune avec son nombre de créatures. */
  protected readonly sources = computed(() => {
    const creatures = this.creatures.data();
    const miennes = creatures.filter((c) => Boolean(c.user_id)).length;
    return [
      {cle: 'tout' as const, label: 'Tout le bestiaire', compte: creatures.length},
      {cle: 'catalogue' as const, label: 'Catalogue commun', compte: creatures.length - miennes},
      {cle: 'miennes' as const, label: 'Mes fiches', compte: miennes},
    ];
  });

  /** Les scénarios qui ont créé ou citent au moins une créature, par titre : leur teinte et leur nombre de créatures. */
  protected readonly scenarios = computed(() => {
    const parId = new Map<string, {id: string; titre: string; oneShot: boolean; compte: number}>();
    for (const creature of this.creatures.data()) {
      for (const scenario of creature.scenarios ?? []) {
        const vu = parId.get(scenario.id);
        parId.set(scenario.id, {id: scenario.id, titre: scenario.titre, oneShot: scenario.one_shot, compte: (vu?.compte ?? 0) + 1});
      }
    }
    const tries = [...parId.values()].sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
    const sagas = tries.filter((s) => !s.oneShot);
    return tries.map((s) => ({...s, teinte: s.oneShot ? 0 : (sagas.indexOf(s) % TEINTES) + 1}));
  });

  private readonly teinteDuScenario = computed(() => new Map(this.scenarios().map((s) => [s.id, s.teinte])));

  protected readonly rangs = computed(() => {
    const creatures = this.creatures.data();
    return RANGS.map((r) => ({...r, compte: creatures.filter((c) => rangDe(c) === r.cle).length}));
  });

  protected readonly filtresActifs = computed(
    () => this.source() !== 'tout' || this.scenarioId() !== null || this.rang() !== null || this.searchTaille() !== '' || this.searchTerm() !== '',
  );

  protected readonly filteredCreatures = computed(() => {
    const source = this.source();
    const scenarioId = this.scenarioId();
    const rang = this.rang();
    const taille = this.searchTaille();
    const {cle, croissant} = this.tri();
    const sens = croissant ? 1 : -1;
    return this.creatures
      .data()
      .filter((c) => source === 'tout' || (source === 'miennes') === Boolean(c.user_id))
      .filter((c) => scenarioId === null || (c.scenarios ?? []).some((s) => s.id === scenarioId))
      .filter((c) => rang === null || rangDe(c) === rang)
      .filter((c) => taille === '' || c.id_taille === taille)
      .filter((c) =>
        matchesTerm(this.searchTerm(), c.nom, c.commentaire, ...c.capacites.map((k) => k.capacite.capacite), ...(c.scenarios ?? []).map((s) => s.titre)),
      )
      .sort((a, b) => {
        const va = valeurDeTri(a, cle);
        const vb = valeurDeTri(b, cle);
        const ecart = typeof va === 'string' ? va.localeCompare(String(vb), 'fr') : va - Number(vb);
        return sens * ecart || a.nom.localeCompare(b.nom, 'fr');
      });
  });
  protected readonly creatureCount = computed(() => this.filteredCreatures().length);

  /** Les lignes du tableau : la créature, son portrait, son rang, ses scénarios avec leur teinte, si elle est au compte. */
  protected readonly lignes = computed(() => {
    const teintes = this.teinteDuScenario();
    return this.filteredCreatures().map((creature) => {
      const rang = rangDe(creature);
      return {
        creature,
        image: creatureImage(creature),
        rang,
        rangLabel: RANGS.find((r) => r.cle === rang)?.label ?? '',
        mienne: Boolean(creature.user_id),
        scenarios: (creature.scenarios ?? []).map((s) => ({id: s.id, titre: s.titre, teinte: teintes.get(s.id) ?? 0})),
      };
    });
  });

  /** Les en-têtes : ceux qui trient disent dans quel sens (`aria-sort`) et montrent la flèche de la colonne triée. */
  protected readonly colonnes = computed(() => {
    const {cle, croissant} = this.tri();
    return COLONNES.map((colonne) => {
      const triee = colonne.cle !== null && colonne.cle === cle;
      return {
        ...colonne,
        ariaSort: colonne.cle === null ? null : triee ? (croissant ? 'ascending' : 'descending') : 'none',
        icone: triee ? (croissant ? 'arrow_upward' : 'arrow_downward') : null,
      };
    });
  });

  /** Trie sur cette colonne ; un second clic inverse le sens. */
  protected trier(cle: Tri): void {
    this.tri.update((tri) => (tri.cle === cle ? {cle, croissant: !tri.croissant} : {cle, croissant: true}));
  }

  protected basculerScenario(id: string): void {
    this.scenarioId.update((courant) => (courant === id ? null : id));
  }

  protected basculerRang(rang: Rang): void {
    this.rang.update((courant) => (courant === rang ? null : rang));
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchTaille.set('');
    this.source.set('tout');
    this.scenarioId.set(null);
    this.rang.set(null);
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
