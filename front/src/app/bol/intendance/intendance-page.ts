import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {BolArmeModel} from '../models/bol-arme.model';
import {BolArmureModel} from '../models/bol-armure.model';
import {BolCatalogService} from '../services/bol-catalog.service';
import {HubPageComponent} from '../shared/hub/hub-page';
import {HubEntry} from '../shared/models/hub-page.model';

/** L'Intendance : les catalogues d'armes et d'armures, sur la page d'accueil de bibliothèques partagée avec le Bestiaire. */
@Component({
  selector: 'bol-intendance-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, HubPageComponent],
  template: `
    <bol-hub-page
      eyebrow="Outils MJ"
      title="Intendance"
      icon="military_tech"
      image="/assets/bol/header-intendance.webp"
      description="L'intendance devient l'espace du meneur pour cadrer l'équipement de la table. Tu y pilotes les catalogues d'armes et d'armures qui servent à préparer les héros, les PNJ, les adversaires et les scènes où le matériel doit rester lisible et cohérent."
      [tags]="[totalEntries() + ' entrées actives', customEntries() + ' créations de table']"
      [entries]="libraryEntries()"
    >
      <button mat-flat-button routerLink="/library/heroes">
        <mat-icon>group</mat-icon> Ouvrir la bibliothèque des héros
      </button>
      <button mat-stroked-button routerLink="/">
        <mat-icon>arrow_back</mat-icon> Retour à l'accueil
      </button>
    </bol-hub-page>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntendancePageComponent {
  private readonly catalogService = inject(BolCatalogService);
  private readonly weapons = toSignal(this.catalogService.armes(), {initialValue: [] as BolArmeModel[]});
  private readonly armors = toSignal(this.catalogService.armures(), {initialValue: [] as BolArmureModel[]});

  protected readonly totalEntries = computed(() => this.weapons().length + this.armors().length);
  protected readonly customEntries = computed(
    () =>
      this.weapons().filter((weapon) => Boolean(weapon.user_id)).length +
      this.armors().filter((armor) => Boolean(armor.user_id)).length,
  );
  protected readonly rangedWeapons = computed(() => this.weapons().filter((weapon) => weapon.type === 'T').length);
  protected readonly meleeWeapons = computed(() => this.weapons().filter((weapon) => weapon.type === 'M').length);
  protected readonly shieldEntries = computed(() =>
    this.armors().filter((armor) => armor.categorie === 'bouclier').length,
  );

  protected readonly libraryEntries = computed<readonly HubEntry[]>(() => [
    {
      title: 'Arsenal',
      kicker: 'Armes',
      description:
        'Catalogue offensif stabilisé avec types, dégâts, portée et notes. C’est le point d’entrée pour gérer le stock jouable de la table.',
      route: '/library/weapons',
      buttonLabel: 'Ouvrir l’arsenal',
      icon: 'sword',
      stats: [
        `${this.weapons().length} entrées`,
        `${this.meleeWeapons()} mêlée`,
        `${this.rangedWeapons()} tir`,
      ],
    },
    {
      title: 'Défenses',
      kicker: 'Armures',
      description:
        'Catalogue défensif finalisé avec protections, malus et points de pouvoir. Il couvre armures, casques et boucliers utilisables dans les profils.',
      route: '/library/armors',
      buttonLabel: 'Ouvrir les armures',
      icon: 'shield',
      stats: [
        `${this.armors().length} entrées`,
        `${this.shieldEntries()} boucliers`,
        `${this.armors().filter((armor) => Boolean(armor.user_id)).length} créations`,
      ],
    },
  ]);
}
