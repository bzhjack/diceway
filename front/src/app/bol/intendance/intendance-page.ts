import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {BolArmeModel} from '../models/bol-arme.model';
import {BolArmureModel} from '../models/bol-armure.model';
import {BolHerosService} from '../services/bol-heros.service';

interface IntendanceOverviewCard {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: string;
  readonly iconClass: string;
}

interface IntendanceLibraryEntry {
  readonly title: string;
  readonly kicker: string;
  readonly description: string;
  readonly route: string;
  readonly buttonLabel: string;
  readonly icon: string;
  readonly accentClass: string;
  readonly accentBorderClass: string;
  readonly stats: readonly string[];
  readonly highlights: readonly string[];
}

@Component({
  selector: 'bol-intendance-page',
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  templateUrl: './intendance-page.html',
  styles: [
    `
      :host ::ng-deep .intendance-header-tag {
        font-size: 0.8rem;
      }

      :host ::ng-deep .intendance-header-tag .p-tag-label {
        line-height: 1;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntendancePageComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly weapons = toSignal(this.herosService.armes(), {initialValue: [] as BolArmeModel[]});
  private readonly armors = toSignal(this.herosService.armures(), {initialValue: [] as BolArmureModel[]});

  protected readonly totalEntries = computed(() => this.weapons().length + this.armors().length);
  protected readonly customEntries = computed(
    () =>
      this.weapons().filter((weapon) => Boolean(weapon.user_id)).length +
      this.armors().filter((armor) => Boolean(armor.user_id)).length,
  );
  protected readonly canonicalEntries = computed(() => this.totalEntries() - this.customEntries());
  protected readonly rangedWeapons = computed(() => this.weapons().filter((weapon) => weapon.type === 'T').length);
  protected readonly meleeWeapons = computed(() => this.weapons().filter((weapon) => weapon.type === 'M').length);
  protected readonly shieldEntries = computed(() =>
    this.armors().filter((armor) => armor.armure.toLocaleLowerCase().includes('bouclier')).length,
  );
  protected readonly libraryEntries = computed<readonly IntendanceLibraryEntry[]>(() => [
    {
      title: 'Arsenal',
      kicker: 'Armes',
      description:
        'Catalogue offensif stabilisé avec types, dégâts, portée et notes. C’est le point d’entrée pour gérer le stock jouable de la table.',
      route: '/library/weapons',
      buttonLabel: 'Ouvrir l’arsenal',
      icon: 'pi pi-bolt',
      accentClass: 'bg-amber-700/90',
      accentBorderClass: 'border-amber-400/30',
      stats: [
        `${this.weapons().length} entrées`,
        `${this.meleeWeapons()} mêlée`,
        `${this.rangedWeapons()} tir`,
      ],
      highlights: [
        'Gestion des variantes et créations maison.',
        'Utilisé directement dans l’équipement avancé des héros.',
        'Tri naturel entre mêlée et distance.',
      ],
    },
    {
      title: 'Défenses',
      kicker: 'Armures',
      description:
        'Catalogue défensif finalisé avec protections, malus et points de pouvoir. Il couvre armures, casques et boucliers utilisables dans les profils.',
      route: '/library/armors',
      buttonLabel: 'Ouvrir les armures',
      icon: 'pi pi-shield',
      accentClass: 'bg-sky-700/90',
      accentBorderClass: 'border-sky-400/30',
      stats: [
        `${this.armors().length} entrées`,
        `${this.shieldEntries()} boucliers`,
        `${this.armors().filter((armor) => Boolean(armor.user_id)).length} créations`,
      ],
      highlights: [
        'Gestion distincte de la protection et des malus.',
        'Cas BoL spéciaux explicités pour éviter les doublons.',
        'Prêt pour l’affectation sur les héros.',
      ],
    },
  ]);
  protected readonly pendingSections = [
    'Carrières et langues',
    'Avantages, désavantages et régions',
  ] as const;
}
