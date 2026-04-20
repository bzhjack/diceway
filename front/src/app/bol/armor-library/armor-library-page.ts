import {ChangeDetectionStrategy, Component, computed, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';

interface ArmorReferenceRow {
  readonly armure: string;
  readonly protection: string;
  readonly malus: string;
  readonly pts_de_pouvoir: string;
}

@Component({
  selector: 'bol-armor-library-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './armor-library-page.html',
  styleUrl: './armor-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmorLibraryPageComponent {
  private readonly armors: readonly ArmorReferenceRow[] = [
    {armure: 'Pas d’armure', protection: '0', malus: '-', pts_de_pouvoir: '-'},
    {armure: 'Armure légère', protection: 'Annule d6-3 (1) dégâts subis', malus: 'Social (sauf si dissimulée)', pts_de_pouvoir: '+1'},
    {armure: 'Armure moyenne', protection: 'Annule d6-2 (2) dégâts subis', malus: 'Social / -1 en agilité', pts_de_pouvoir: '+2'},
    {armure: 'Armure lourde', protection: 'Annule d6-1 (3) dégâts subis', malus: 'Social / -2 en agilité', pts_de_pouvoir: '+3'},
    {armure: 'Casque', protection: '+1 à la protection de l’armure', malus: 'Social / -1 en initiative', pts_de_pouvoir: '-'},
    {armure: 'Petit bouclier', protection: 'Impose un malus de -1 à une attaque subie par round', malus: '-', pts_de_pouvoir: '-'},
    {armure: 'Grand bouclier', protection: 'Impose un malus de -1 à toutes les attaques subies par round', malus: '-1 en agilité', pts_de_pouvoir: '-'},
  ] as const;

  protected readonly searchTerm = signal('');
  protected readonly filteredArmors = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();

    return [...this.armors]
      .filter((armor) => {
        if (!term) {
          return true;
        }

        return [
          armor.armure,
          armor.protection,
          armor.malus,
          armor.pts_de_pouvoir,
        ].some((value) => value?.toLocaleLowerCase().includes(term));
      });
  });
  protected readonly totalArmorCount = computed(() => this.armors.length);
  protected readonly shieldCount = computed(() =>
    this.armors.filter((armor) => armor.armure.toLocaleLowerCase().includes('bouclier')).length,
  );

  protected clearFilters(): void {
    this.searchTerm.set('');
  }
}
