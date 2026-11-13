import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BolCreatureModel} from '../models/bol-creature.model';
import {BolDemonModel} from '../models/bol-demon.model';
import {BolCreaturesService} from '../services/bol-creatures.service';
import {BolDemonsService} from '../services/bol-demons.service';
import {HubPageComponent} from '../shared/hub/hub-page';
import {HubEntry} from '../shared/models/hub-page.model';

/** Ce qu'une bibliothèque compte : tout, le catalogue commun, les fiches du compte. */
function compteurs(fiches: readonly {user_id: string | null}[], nom: string): string[] {
  const miennes = fiches.filter((f) => Boolean(f.user_id)).length;
  return [`${fiches.length} ${nom}`, `${fiches.length - miennes} du catalogue`, `${miennes} de mes fiches`];
}

/** Le Bestiaire : les créatures et les démons, sur la page d'accueil de bibliothèques partagée avec l'Intendance. */
@Component({
  selector: 'bol-bestiaire-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, HubPageComponent],
  template: `
    <bol-hub-page
      eyebrow="Adversaires"
      title="Bestiaire"
      icon="pets"
      image="/assets/bol/header-creatures.webp"
      description="Les bêtes et les entités infernales qui se dressent contre les héros : celles du catalogue commun, et les fiches de tes scénarios. Chaque bibliothèque se filtre par scénario, par rang et par taille ou catégorie."
      [tags]="[total() + ' fiches', miennes() + ' de mes fiches']"
      [entries]="entries()"
    >
      <button mat-stroked-button routerLink="/library/pnjs">
        <mat-icon>manage_accounts</mat-icon> Ouvrir la galerie des PNJ
      </button>
      <button mat-flat-button routerLink="/">
        <mat-icon>arrow_back</mat-icon> Retour à l'accueil
      </button>
    </bol-hub-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BestiairePageComponent {
  private readonly creatures = toSignal(inject(BolCreaturesService).creatures(), {initialValue: [] as BolCreatureModel[]});
  private readonly demons = toSignal(inject(BolDemonsService).demons(), {initialValue: [] as BolDemonModel[]});

  protected readonly total = computed(() => this.creatures().length + this.demons().length);
  protected readonly miennes = computed(() => [...this.creatures(), ...this.demons()].filter((f) => Boolean(f.user_id)).length);

  protected readonly entries = computed((): HubEntry[] => [
    {
      title: 'Créatures',
      kicker: 'Bêtes et monstres',
      description: 'Des bêtes des plaines aux horreurs des cryptes : leur taille donne leur rang, leurs capacités leurs manières de tuer.',
      route: '/library/creatures',
      buttonLabel: 'Ouvrir les créatures',
      icon: 'pets',
      stats: compteurs(this.creatures(), 'créatures'),
      creer: {route: '/create/creature', label: 'Créer une créature'},
      image: '/assets/bol/fond-creatures.webp',
    },
    {
      title: 'Démons',
      kicker: 'Entités infernales',
      description: 'Des démons mineurs aux seigneurs des abîmes : leur catégorie donne leur rang, leurs pouvoirs infernaux leur menace.',
      route: '/library/demons',
      buttonLabel: 'Ouvrir les démons',
      icon: 'bolt',
      stats: compteurs(this.demons(), 'démons'),
      creer: {route: '/create/demon', label: 'Créer un démon'},
      image: '/assets/bol/fond-demons.webp',
    },
  ]);
}
