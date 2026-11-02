import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BolAccueilComptes, BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {usableAvatar} from '../../../shared/avatar-fallback/avatar.util';
import {ANNEAU_RAYON, accueilSagas, sagaResumes, tableOuverte} from './accueil.util';

interface AccueilBibliotheque {
  readonly cle: keyof BolAccueilComptes;
  readonly label: string;
  readonly route: string;
  /** Le lien pour créer une fiche de cette bibliothèque, quand il y en a un. */
  readonly creer?: {readonly route: string; readonly ariaLabel: string};
}

const BIBLIOTHEQUES: readonly AccueilBibliotheque[] = [
  {cle: 'heros', label: 'Héros', route: '/library/heroes', creer: {route: '/create/hero', ariaLabel: 'Créer un héros'}},
  {cle: 'pnjs', label: 'PNJ', route: '/library/pnjs', creer: {route: '/create/pnj', ariaLabel: 'Créer un PNJ'}},
  {cle: 'creatures', label: 'Créatures', route: '/library/creatures', creer: {route: '/create/creature', ariaLabel: 'Créer une créature'}},
  {cle: 'demons', label: 'Démons', route: '/library/demons', creer: {route: '/create/demon', ariaLabel: 'Créer un démon'}},
  {cle: 'armes', label: 'Armes', route: '/library/weapons'},
  {cle: 'armures', label: 'Armures', route: '/library/armors'},
  {cle: 'sessions', label: 'Sessions', route: '/library/sessions'},
];

/** Accueil, sur `/` : la table ouverte à reprendre et la compagnie de la dernière table, puis une carte par saga (son avancement et le
 * chapitre à jouer ensuite, qui ouvre une nouvelle table), puis les bibliothèques avec leur nombre de fiches et de quoi en créer. */
@Component({
  selector: 'bol-accueil-page',
  imports: [NgOptimizedImage, RouterLink, MatButtonModule, MatIconModule, AccountMenuComponent, AvatarFallbackDirective],
  templateUrl: './accueil-page.html',
  styleUrl: './accueil-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccueilPageComponent {
  private readonly accueilService = inject(BolAccueilService);

  protected readonly data = signal<BolAccueilModel | null>(null);
  protected readonly error = signal(false);
  protected readonly anneauRayon = ANNEAU_RAYON;

  protected readonly sagas = computed(() => {
    const data = this.data();
    return data
      ? sagaResumes(accueilSagas(data.scenarios, new Set(data.scenarios_joues), data.table?.scenario_id ?? null, data.scenario_recent_id))
      : [];
  });

  protected readonly table = computed(() => {
    const data = this.data();
    return data?.table ? tableOuverte(data.table, data.scenarios) : null;
  });

  /** La teinte de la saga de la table ouverte, pour son étiquette ; 0 sans saga. */
  protected readonly tableTeinte = computed(() => {
    const saga = this.table()?.saga ?? null;
    return saga === null ? 0 : (this.sagas().find((resume) => resume.nom === saga)?.teinte ?? 0);
  });

  protected readonly compagnie = computed(() =>
    (this.data()?.compagnie ?? []).map((heros) => ({...heros, portrait: usableAvatar(heros.avatar), initiale: heros.nom.charAt(0).toUpperCase()})),
  );

  protected readonly bibliotheques = computed(() => {
    const comptes = this.data()?.comptes ?? null;
    return BIBLIOTHEQUES.map((bibliotheque) => ({...bibliotheque, compte: comptes ? comptes[bibliotheque.cle] : null}));
  });

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
