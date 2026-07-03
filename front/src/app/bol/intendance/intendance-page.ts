import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {BolArmeModel} from '../models/bol-arme.model';
import {BolArmureModel} from '../models/bol-armure.model';
import {BolHerosService} from '../services/bol-heros.service';
import {DwTagComponent} from '../../shared/dw-tag/dw-tag';

interface IntendanceLibraryEntry {
  readonly title: string;
  readonly kicker: string;
  readonly description: string;
  readonly route: string;
  readonly buttonLabel: string;
  readonly icon: string;
  readonly accentClass: string;
  readonly stats: readonly string[];
}

@Component({
  selector: 'bol-intendance-page',
  imports: [RouterLink, MatButtonModule, MatCard, MatCardContent, DwTagComponent],
  templateUrl: './intendance-page.html',
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
      icon: 'pi pi-shield',
      accentClass: 'bg-sky-700/90',
      stats: [
        `${this.armors().length} entrées`,
        `${this.shieldEntries()} boucliers`,
        `${this.armors().filter((armor) => Boolean(armor.user_id)).length} créations`,
      ],
    },
  ]);
}
