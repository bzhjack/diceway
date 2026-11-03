import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgOptimizedImage} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BolAccueilComptes, BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {CloseTableService} from '../../shared/close-table/close-table.service';
import {AvatarFallbackDirective} from '../../../shared/avatar-fallback/avatar-fallback.directive';
import {usableAvatar} from '../../../shared/avatar-fallback/avatar.util';
import {ANNEAU_RAYON, accueilSagas, sagaResumes, tableOuverte, teinteDeSaga} from './accueil.util';

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

/** Accueil, sur `/` : la table ouverte à reprendre (ou à clore) et la compagnie de la dernière table, puis une carte par saga (son avancement et le
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
  private readonly closeTable = inject(CloseTableService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly data = signal<BolAccueilModel | null>(null);
  protected readonly error = signal(false);
  /** L'accueil n'a pas encore répondu : on ne sait pas encore s'il y a une table ouverte. */
  protected readonly chargement = computed(() => this.data() === null && !this.error());
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
  protected readonly tableTeinte = computed(() => teinteDeSaga(this.sagas(), this.table()?.saga ?? null));

  protected readonly compagnie = computed(() =>
    (this.data()?.compagnie ?? []).map((heros) => ({...heros, portrait: usableAvatar(heros.avatar), initiale: heros.nom.charAt(0).toUpperCase()})),
  );

  protected readonly bibliotheques = computed(() => {
    const comptes = this.data()?.comptes ?? null;
    return BIBLIOTHEQUES.map((bibliotheque) => ({...bibliotheque, compte: comptes ? comptes[bibliotheque.cle] : null}));
  });

  constructor() {
    this.charger();
  }

  /** « Clore la table » du bandeau : une fois close, l'accueil est relu (plus de table ouverte, son chapitre compte comme joué). */
  protected clore(): void {
    const table = this.data()?.table;
    if (!table) {
      return;
    }
    this.closeTable
      .clore({id: table.id, enCombat: table.statut === 'combat'})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((close) => {
        if (close) {
          this.charger();
        }
      });
  }

  private charger(): void {
    this.accueilService
      .accueil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.data.set(data),
        error: () => this.error.set(true),
      });
  }
}
