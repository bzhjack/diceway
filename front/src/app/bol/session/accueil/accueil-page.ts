import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {ChapitreEtat} from '../models/accueil.model';
import {accueilSagas, tableTitre} from './accueil.util';

interface AccueilTuile {
  readonly label: string;
  /** Le nom complet du lien : « Héros » se lit deux fois sur la page, une fois pour créer, une fois pour la bibliothèque. */
  readonly ariaLabel: string;
  readonly icon: string;
  readonly route: string;
}

const TUILES_CREER: readonly AccueilTuile[] = [
  {label: 'Héros', ariaLabel: 'Créer un héros', icon: 'gi-laurels', route: '/create/hero'},
  {label: 'PNJ', ariaLabel: 'Créer un PNJ', icon: 'gi-masks', route: '/create/pnj'},
  {label: 'Créature', ariaLabel: 'Créer une créature', icon: 'gi-paw', route: '/create/creature'},
  {label: 'Démon', ariaLabel: 'Créer un démon', icon: 'gi-demon', route: '/create/demon'},
];

const TUILES_BIBLIOTHEQUES: readonly AccueilTuile[] = [
  {label: 'Sessions', ariaLabel: 'Bibliothèque des sessions', icon: 'gi-dice', route: '/library/sessions'},
  {label: 'Héros', ariaLabel: 'Bibliothèque des héros', icon: 'gi-laurels', route: '/library/heroes'},
  {label: 'PNJ', ariaLabel: 'Bibliothèque des PNJ', icon: 'gi-masks', route: '/library/pnjs'},
  {label: 'Créatures', ariaLabel: 'Bibliothèque des créatures', icon: 'gi-paw', route: '/library/creatures'},
  {label: 'Démons', ariaLabel: 'Bibliothèque des démons', icon: 'gi-demon', route: '/library/demons'},
  {label: 'Armes', ariaLabel: 'Bibliothèque des armes', icon: 'gi-sword', route: '/library/weapons'},
  {label: 'Armures', ariaLabel: 'Bibliothèque des armures', icon: 'gi-shield', route: '/library/armors'},
];

/** Le repère écrit à côté d'un chapitre : l'état ne se dit jamais par la seule couleur. */
const REPERES: Readonly<Record<ChapitreEtat, string | null>> = {
  'joue': 'joué',
  'en-cours': 'en cours',
  'prochain': 'à suivre',
  'a-jouer': null,
};

/** Accueil, sur `/` : la table ouverte à reprendre, les scénarios par saga (un chapitre ouvre une nouvelle table sur le seuil), puis de quoi
 * créer une fiche et ouvrir les bibliothèques. */
@Component({
  selector: 'bol-accueil-page',
  imports: [NgOptimizedImage, RouterLink, MatButtonModule, MatIconModule, AccountMenuComponent],
  templateUrl: './accueil-page.html',
  styleUrl: './accueil-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccueilPageComponent {
  private readonly accueilService = inject(BolAccueilService);

  protected readonly data = signal<BolAccueilModel | null>(null);
  protected readonly error = signal(false);

  protected readonly sagas = computed(() => {
    const data = this.data();
    return data
      ? accueilSagas(data.scenarios, new Set(data.scenarios_joues), data.table?.scenario_id ?? null, data.scenario_recent_id)
      : [];
  });

  protected readonly bandeau = computed(() => {
    const data = this.data();
    return data?.table ? {id: data.table.id, titre: tableTitre(data.table, data.scenarios)} : null;
  });

  protected readonly tuilesCreer = TUILES_CREER;
  protected readonly tuilesBibliotheques = TUILES_BIBLIOTHEQUES;
  protected readonly reperes = REPERES;

  constructor() {
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set(true),
      });
  }
}
