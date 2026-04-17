import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ConfirmationService} from 'primeng/api';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolHerosService} from '../services/bol-heros.service';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {CheckboxModule} from 'primeng/checkbox';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {PopoverModule} from 'primeng/popover';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {TooltipModule} from 'primeng/tooltip';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {startWith, switchMap} from 'rxjs';

interface HeroListEntry {
  readonly label: string;
  readonly value: string | number;
}

interface HeroTraitDetail {
  readonly title: string;
  readonly description: string | null;
}

interface HeroTraitEntry {
  readonly label: string;
  readonly details: readonly HeroTraitDetail[];
  readonly severity: 'positive' | 'negative';
  readonly icon: 'info' | 'attr' | 'd6';
}

@Component({
  selector: 'bol-hero-library-page',
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    CheckboxModule,
    ConfirmPopupModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PopoverModule,
    TableModule,
    TagModule,
    TooltipModule,
    InlineSVGModule,
  ],
  templateUrl: './hero-library-page.html',
  styleUrl: './hero-library-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmationService],
})
export class HeroLibraryPageComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly refreshTrigger = signal(0);
  private readonly heroes = toSignal(
    toObservable(this.refreshTrigger).pipe(
      startWith(0),
      switchMap(() => this.herosService.heroes()),
    ),
    { initialValue: [] },
  );

  protected readonly searchTerm = signal('');
  protected readonly onlyPending = signal(false);

  protected readonly filteredHeroes = computed(() =>
    [...this.heroes()]
      .filter((hero) => (this.onlyPending() ? !hero.active : true))
      .filter((hero) => {
        const term = this.searchTerm().trim().toLocaleLowerCase();
        if (!term) {
          return true;
        }

        const searchValues = [
          hero.origines.nom,
          hero.origines.joueur,
          hero.origines.commentaire,
          hero.origines.region?.region,
          this.languagesText(hero),
        ];

        return searchValues.some((value) => value?.toLocaleLowerCase().includes(term));
      })
      .sort((left, right) => {
        if (left.active !== right.active) {
          return left.active ? 1 : -1;
        }

        return (left.origines.nom ?? '').localeCompare(right.origines.nom ?? '');
      }),
  );
  protected readonly heroCount = computed(() => this.filteredHeroes().length);
  protected readonly totalHeroCount = computed(() => this.heroes().length);

  protected askDelete(event: Event, hero: BolHerosModel): void {
    this.confirmationService.confirm({
      target: event.currentTarget as EventTarget,
      message: 'Voulez-vous supprimer ce héros ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: 'Oui',
      rejectLabel: 'Non',
      accept: () => this.deleteHero(hero),
    });
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.onlyPending.set(false);
  }

  protected heroImage(hero: BolHerosModel): string {
    return hero.origines.avatar || '/assets/bol/empty-avatar.jpg';
  }

  protected resourceEntries(hero: BolHerosModel): readonly HeroListEntry[] {
    return [
      { label: 'Vitalité', value: hero.ressources.vitalite },
      { label: 'Pouvoir', value: hero.ressources.pouvoir },
      { label: 'Foi', value: hero.ressources.foi },
      { label: 'Vilénie', value: hero.ressources.vilenie },
      { label: 'Héroïsme', value: hero.ressources.heroisme },
    ].filter((entry, index) => index === 0 || Number(entry.value) > 0);
  }

  protected careerEntries(hero: BolHerosModel): readonly HeroListEntry[] {
    return hero.carrieres
      .map((carriere) => ({
        label: carriere.carriere?.carriere ?? '',
        value: carriere.value,
      }))
      .filter((entry) => entry.label);
  }

  protected armorEntries(hero: BolHerosModel): readonly HeroListEntry[] {
    return hero.armures
      .filter((armure): armure is Exclude<(typeof hero.armures)[number], number> => typeof armure === 'object')
      .map((armure) => ({
        label: armure.armure?.armure ?? '',
        value: armure.armure?.protection ?? '-',
      }))
      .filter((entry) => entry.label);
  }

  protected weaponEntries(hero: BolHerosModel): readonly HeroListEntry[] {
    return hero.armes
      .filter((arme): arme is Exclude<(typeof hero.armes)[number], number> => typeof arme === 'object')
      .map((arme) => ({
        label: arme.arme?.arme ?? '',
        value: arme.arme?.degats ?? '-',
      }))
      .filter((entry) => entry.label);
  }

  protected traitEntries(hero: BolHerosModel): readonly HeroTraitEntry[] {
    return hero.traits
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

  protected languagesText(hero: BolHerosModel): string {
    return hero.origines.langues
      .filter((langue): langue is Exclude<(typeof hero.origines.langues)[number], number> => typeof langue === 'object')
      .map((langue) => langue.langue?.langue ?? '')
      .filter(Boolean)
      .join(', ');
  }

  protected traitIconPath(icon: HeroTraitEntry['icon']): string {
    switch (icon) {
      case 'd6':
        return '/assets/d6.svg';
      case 'attr':
        return '/assets/attr.svg';
      default:
        return '/assets/info.svg';
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

  private traitIcon(trait: BolHerosModel['traits'][number]): 'info' | 'attr' | 'd6' {
    if (trait.traitable && 'de_bonus' in trait.traitable && trait.traitable.de_bonus) {
      return 'd6';
    }

    if (trait.traitable && 'de_malus' in trait.traitable && trait.traitable.de_malus) {
      return 'd6';
    }

    if (trait.traitable && 'attribut' in trait.traitable && trait.traitable.attribut) {
      return 'attr';
    }

    return 'info';
  }

  private deleteHero(hero: BolHerosModel): void {
    if (!hero.id) {
      return;
    }

    this.herosService.deleteHeros(hero.id).subscribe({
      next: () => this.refreshTrigger.update((value) => value + 1),
    });
  }

  private traitDetails(trait: BolHerosModel['traits'][number]): readonly HeroTraitDetail[] {
    const details: HeroTraitDetail[] = [];

    if (trait.traitable && 'de_bonus' in trait.traitable && trait.traitable.de_bonus) {
      details.push({
        title: 'Dé bonus',
        description: trait.traitable.de_bonus_domaine,
      });
    }

    if (trait.traitable && 'de_malus' in trait.traitable && trait.traitable.de_malus) {
      details.push({
        title: 'Dé malus',
        description: trait.traitable.de_malus_domaine,
      });
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
      details.push({
        title: 'Détails',
        description: trait.traitable.description,
      });
    }

    if (trait.detail) {
      details.push({
        title: 'Précision',
        description: trait.detail,
      });
    }

    return details;
  }
}
