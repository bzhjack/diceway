import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolHerosService} from '../services/bol-heros.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TableModule} from 'primeng/table';
import {TooltipModule} from 'primeng/tooltip';
import {startWith, switchMap} from 'rxjs';

type PnjType = 'P' | 'C' | 'R';

interface PnjTypeOption {
  readonly label: string;
  readonly value: PnjType | null;
}

interface PnjListEntry {
  readonly label: string;
  readonly value: string | number;
}

interface PnjTraitEntry {
  readonly label: string;
  readonly detail: string | null;
  readonly severity: 'positive' | 'negative';
}

@Component({
  selector: 'bol-pnj-library-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './pnj-library-page.html',
  styleUrl: './pnj-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjLibraryPageComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly refreshTrigger = signal(0);
  private readonly pnjs = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.herosService.pnjs()),
    ),
    { initialValue: [] },
  );

  protected readonly typeOptions: PnjTypeOption[] = [
    { label: 'Tous les profils', value: null },
    { label: 'Coriaces', value: 'C' },
    { label: 'Rivaux', value: 'R' },
    { label: 'Pietaille', value: 'P' },
  ];
  protected readonly searchTerm = signal('');
  protected readonly searchType = signal<PnjType | null>(null);
  protected readonly onlyCreations = signal(false);

  protected readonly filteredPnjs = computed(() =>
    [...this.pnjs()]
      .filter((pnj) => (this.onlyCreations() ? Boolean(pnj.user_id) : true))
      .filter((pnj) => (this.searchType() ? pnj.type === this.searchType() : true))
      .filter((pnj) => {
        const term = this.searchTerm().trim().toLocaleLowerCase();
        if (!term) {
          return true;
        }

        const searchValues = [
          pnj.origines.nom,
          pnj.origines.commentaire,
          pnj.origines.region?.region,
          this.typeLabel(pnj.type),
          this.languagesText(pnj),
        ];

        return searchValues.some((value) => value?.toLocaleLowerCase().includes(term));
      })
      .sort((left, right) => {
        const typeCompare = this.typeOrder(left.type) - this.typeOrder(right.type);
        if (typeCompare !== 0) {
          return typeCompare;
        }

        return (left.origines.nom ?? '').localeCompare(right.origines.nom ?? '');
      }),
  );
  protected readonly pnjCount = computed(() => this.filteredPnjs().length);
  protected readonly totalPnjCount = computed(() => this.pnjs().length);

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchType.set(null);
    this.onlyCreations.set(false);
  }

  protected pnjImage(pnj: BolHerosModel): string {
    if (!pnj.user_id && pnj.id) {
      return `/assets/bol/pnj/${pnj.id}.jpg`;
    }

    return pnj.origines.avatar || '/assets/bol/empty-avatar.jpg';
  }

  protected typeLabel(type: string | null | undefined): string {
    switch (type) {
      case 'C':
        return 'Coriaces';
      case 'R':
        return 'Rivaux';
      case 'P':
        return 'Pietaille';
      default:
        return 'Profils';
    }
  }

  protected resourceEntries(pnj: BolHerosModel): readonly PnjListEntry[] {
    return [
      { label: 'Vitalite', value: pnj.ressources.vitalite },
      { label: 'Pouvoir', value: pnj.ressources.pouvoir },
      { label: 'Foi', value: pnj.ressources.foi },
      { label: 'Vilenie', value: pnj.ressources.vilenie },
      { label: 'Heroisme', value: pnj.ressources.heroisme },
    ].filter((entry, index) => index === 0 || Number(entry.value) > 0);
  }

  protected careerEntries(pnj: BolHerosModel): readonly PnjListEntry[] {
    return pnj.carrieres
      .map((carriere) => ({
        label: carriere.carriere?.carriere ?? '',
        value: carriere.value,
      }))
      .filter((entry) => entry.label);
  }

  protected armorEntries(pnj: BolHerosModel): readonly PnjListEntry[] {
    return pnj.armures
      .filter((armure): armure is Exclude<(typeof pnj.armures)[number], number> => typeof armure === 'object')
      .map((armure) => ({
        label: armure.armure?.armure ?? '',
        value: armure.armure?.protection ?? '-',
      }))
      .filter((entry) => entry.label);
  }

  protected weaponEntries(pnj: BolHerosModel): readonly PnjListEntry[] {
    return pnj.armes
      .filter((arme): arme is Exclude<(typeof pnj.armes)[number], number> => typeof arme === 'object')
      .map((arme) => ({
        label: arme.arme?.arme ?? '',
        value: arme.arme?.degats ?? '-',
      }))
      .filter((entry) => entry.label);
  }

  protected traitEntries(pnj: BolHerosModel): readonly PnjTraitEntry[] {
    return pnj.traits
      .map((trait) => {
        if (trait.type === 'D') {
          return {
            label: this.desavantageLabel(trait.traitable),
            detail: trait.detail || trait.traitable?.description || null,
            severity: 'negative' as const,
          };
        }

        return {
          label: this.avantageLabel(trait.traitable),
          detail: trait.detail || trait.traitable?.description || null,
          severity: 'positive' as const,
        };
      })
      .filter((entry) => entry.label);
  }

  protected languagesText(pnj: BolHerosModel): string {
    return pnj.origines.langues
      .filter((langue): langue is Exclude<(typeof pnj.origines.langues)[number], number> => typeof langue === 'object')
      .map((langue) => langue.langue?.langue ?? '')
      .filter(Boolean)
      .join(', ');
  }

  private typeOrder(type: string | null | undefined): number {
    switch (type) {
      case 'C':
        return 1;
      case 'R':
        return 2;
      case 'P':
        return 3;
      default:
        return 99;
    }
  }

  private avantageLabel(traitable: BolHerosModel['traits'][number]['traitable'] | undefined): string {
    if (traitable && 'avantage' in traitable) {
      return traitable.avantage;
    }

    return '';
  }

  private desavantageLabel(traitable: BolHerosModel['traits'][number]['traitable'] | undefined): string {
    if (traitable && 'desavantage' in traitable) {
      return traitable.desavantage;
    }

    return '';
  }
}
