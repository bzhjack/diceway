import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolHerosService} from '../services/bol-heros.service';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatMenuModule} from '@angular/material/menu';
import {MatSelectModule} from '@angular/material/select';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatCard} from '@angular/material/card';
import {InlineSvgDirective} from '../../shared/inline-svg/inline-svg.directive';
import {DwTagComponent} from '../../shared/dw-tag/dw-tag';
import {DwLibraryHeaderComponent} from '../../shared/dw-library-header/dw-library-header';
import {DwLibraryToolbarComponent} from '../../shared/dw-library-toolbar/dw-library-toolbar';
import {DwConfirmDialogComponent} from '../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {startWith, switchMap} from 'rxjs';
import {TraitIcon, traitIconPath, traitIconType} from '../shared/trait-icon';

type PnjType = 'P' | 'C' | 'R';

interface PnjTypeOption {
  readonly label: string;
  readonly value: PnjType | '';
}

interface PnjListEntry {
  readonly label: string;
  readonly value: string | number;
}

interface PnjTraitEntry {
  readonly label: string;
  readonly details: readonly PnjTraitDetail[];
  readonly severity: 'positive' | 'negative';
  readonly icon: TraitIcon;
}

interface PnjTraitDetail {
  readonly title: string;
  readonly description: string | null;
}

@Component({
  selector: 'bol-pnj-library-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    MatTooltipModule,
    MatCard,
    InlineSvgDirective,
    DwTagComponent,
    DwLibraryHeaderComponent,
    DwLibraryToolbarComponent,
  ],
  templateUrl: './pnj-library-page.html',
  styleUrl: './pnj-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjLibraryPageComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly dialog = inject(MatDialog);
  private readonly refreshTrigger = signal(0);
  private readonly pnjs = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.herosService.pnjs()),
    ),
    {initialValue: []},
  );

  protected readonly typeOptions: PnjTypeOption[] = [
    {label: 'Tous les profils', value: ''},
    {label: 'Coriaces', value: 'C'},
    {label: 'Rivaux', value: 'R'},
    {label: 'Pietaille', value: 'P'},
  ];
  protected readonly searchTerm = signal('');
  protected readonly searchType = signal<PnjType | ''>('');
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

  protected showGroupHeader(index: number): boolean {
    const pnjs = this.filteredPnjs();
    return index === 0 || pnjs[index - 1].type !== pnjs[index].type;
  }

  protected askDelete(pnj: BolHerosModel): void {
    this.dialog
      .open(DwConfirmDialogComponent, {
        data: {
          title: 'Supprimer le PNJ',
          message: `Voulez-vous supprimer "${pnj.origines.nom ?? 'ce PNJ'}" ?`,
          confirmLabel: 'Supprimer',
        },
        width: '380px',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deletePnj(pnj);
        }
      });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.searchType.set('');
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
      {label: 'Vitalite', value: pnj.ressources.vitalite},
      {label: 'Pouvoir', value: pnj.ressources.pouvoir},
      {label: 'Foi', value: pnj.ressources.foi},
      {label: 'Vilenie', value: pnj.ressources.vilenie},
      {label: 'Heroisme', value: pnj.ressources.heroisme},
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
            details: this.traitDetails(trait),
            severity: 'negative' as const,
            icon: this.traitIcon(trait),
          };
        }

        return {
          label: this.avantageLabel(trait.traitable),
          details: this.traitDetails(trait),
          severity: 'positive' as const,
          icon: this.traitIcon(trait),
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

  protected readonly traitIconPath = traitIconPath;

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

  private traitIcon(trait: BolHerosModel['traits'][number]): TraitIcon {
    return traitIconType(trait.traitable);
  }

  private deletePnj(pnj: BolHerosModel): void {
    if (!pnj.id) {
      return;
    }

    this.herosService.quickDelete(pnj.id).subscribe({
      next: () => this.refreshTrigger.update((value) => value + 1),
    });
  }

  private traitDetails(trait: BolHerosModel['traits'][number]): readonly PnjTraitDetail[] {
    const details: PnjTraitDetail[] = [];

    if (trait.traitable && 'de_bonus' in trait.traitable && trait.traitable.de_bonus) {
      details.push({title: 'Dé bonus', description: trait.traitable.de_bonus_domaine});
    }

    if (trait.traitable && 'de_malus' in trait.traitable && trait.traitable.de_malus) {
      details.push({title: 'Dé malus', description: trait.traitable.de_malus_domaine});
    }

    if (trait.traitable && 'attribut' in trait.traitable && trait.traitable.attribut) {
      const attributeValue =
        'attribut_bonus' in trait.traitable
          ? trait.traitable.attribut_bonus
          : 'attribut_malus' in trait.traitable
            ? trait.traitable.attribut_malus
            : null;

      details.push({
        title: 'Attribut',
        description: `${trait.traitable.attribut}${attributeValue !== null ? `(${attributeValue})` : ''}`,
      });
    }

    if (trait.traitable?.description) {
      details.push({title: 'Détails', description: trait.traitable.description});
    }

    if (trait.detail) {
      details.push({title: 'Précision', description: trait.detail});
    }

    return details;
  }
}
