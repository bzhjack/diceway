import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';

@Component({
  selector: 'bol-intendance-page',
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  templateUrl: './intendance-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntendancePageComponent {
  protected readonly libraryEntries = [
    {
      title: 'Armes',
      description: 'Table BoL, variantes projet, dégâts, portée et notes d’usage.',
      icon: 'pi pi-bolt',
      route: '/library/weapons',
      accentClass: 'bg-amber-700',
      status: 'Disponible',
    },
    {
      title: 'Armures',
      description: 'Armures, casques, boucliers et cas spéciaux utilisés dans les profils.',
      icon: 'pi pi-shield',
      route: '/library/armors',
      accentClass: 'bg-sky-700',
      status: 'Disponible',
    },
  ] as const;
  protected readonly pendingSections = [
    'Carrières et langues',
    'Avantages, désavantages et régions',
  ] as const;
}
