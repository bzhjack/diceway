import {computed, inject, Injectable, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {BolArmeModel} from '../models/bol-arme.model';
import {BolArmureModel} from '../models/bol-armure.model';
import {
  AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID,
  AVANTAGE_MAITRE_ARTISAN_ID,
  AVANTAGE_POUVOIR_DU_NEANT_ID,
  CARRIERE_ALCHIMISTE_ID,
  CARRIERE_FORGERON_ID,
  CARRIERE_PRETRE_ID,
  CARRIERE_SORCIER_ID,
  DESAVANTAGE_NON_COMBATTANT_ID,
} from '../bol-rules.constants';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolCatalogService} from './bol-catalog.service';
import {HeroCreationWarning, AttributModifier} from '../models/bol-heros-state.model';

@Injectable({
  providedIn: 'root',
})
export class BolHerosStateService {
  #catalog = inject(BolCatalogService);
  readonly langueList = toSignal(this.#catalog.langues());
  readonly regionList = toSignal(this.#catalog.regions());
  readonly carriereList = toSignal(this.#catalog.carrieres());
  readonly currentHeros = signal<BolHerosModel | null>(null);
  readonly avantagesList = toSignal(this.#catalog.avantages());
  readonly desavantagesList = toSignal(this.#catalog.desavantages());
  readonly currentHerosCarrieres = computed(() => this.currentHeros()?.carrieres ?? []);

  /**
   * Armes/armures sont éditables depuis l'intendance (bol-catalog-service.armes/armures ne cache rien) :
   * contrairement aux référentiels ci-dessus (langues/régions/carrières/traits, non éditables dans l'app),
   * ces deux listes doivent être rechargées à chaque formulaire héros/PNJ plutôt que figées une fois pour
   * toutes à la création du singleton — d'où un signal réinscriptible + `refreshEquipmentCatalog()`.
   */
  readonly armeList = signal<BolArmeModel[] | undefined>(undefined);
  readonly armureList = signal<BolArmureModel[] | undefined>(undefined);

  refreshEquipmentCatalog(): void {
    this.#catalog.armes().subscribe((list) => this.armeList.set(list));
    this.#catalog.armures().subscribe((list) => this.armureList.set(list));
  }

  // E11: Non-combattant modifie les budgets combat et carrières
  readonly isNonCombattant = computed(() =>
    this.currentHeros()?.traits?.some(
      (t) => t.type === 'D' && t.carriere === false && t.traitable_id === DESAVANTAGE_NON_COMBATTANT_ID,
    ) ?? false,
  );
  readonly combatBudget = computed(() => (this.isNonCombattant() ? 2 : 4));
  readonly carriereBudget = computed(() => (this.isNonCombattant() ? 6 : 4));

  // E12: avantages spéciaux exigeant un désavantage supplémentaire
  readonly specialAvantageDesavantageRequired = computed(() => {
    const ids = this.currentHeroAvantages().map((t) => t.traitable_id);
    return (
      (ids.includes(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID) ? 1 : 0) +
      (ids.includes(AVANTAGE_POUVOIR_DU_NEANT_ID) ? 1 : 0)
    );
  });

  readonly carriereDesavantageCount = computed(() => {
    let countDesavantage = 0;
    this.currentHerosCarrieres().forEach((carriere) => {
      switch (carriere.carriere_id) {
        // Alchimiste : un désavantage par rang au-dessus de 2
        case CARRIERE_ALCHIMISTE_ID:
          countDesavantage += Math.max(carriere.value - 2, 0);
          break;
        // Sorcier : un désavantage par rang au-dessus de 1
        case CARRIERE_SORCIER_ID:
          countDesavantage += Math.max(carriere.value - 1, 0);
          break;
      }
    });
    return Math.max(countDesavantage - this.currentHeroCarriereDesvantages().length, 0);
  });

  readonly currentHerosRegion = computed(() =>
    this.regionList()?.find(
      (region) =>
        this.currentHeros()?.origines.region_id === region.id
    )
  );

  protected readonly currentHeroAvantages = computed(
    () => this.currentHeros()?.traits?.filter((item) => item.type === 'A') ?? []
  );
  protected readonly currentHeroDesavantages = computed(
    () =>
      this.currentHeros()?.traits?.filter(
        (item) => item.type === 'D' && item.carriere === false
      ) ?? []
  );
  protected readonly currentHeroRegionalDesavantages = computed(
    () => this.currentHeroDesavantages().filter((item) => (item.region_id ?? 0) > 0) ?? []
  );
  protected readonly currentHeroGeneralDesavantages = computed(
    () => this.currentHeroDesavantages().filter((item) => (item.region_id ?? 0) <= 0) ?? []
  );
  protected readonly currentHeroCarriereDesvantages = computed(
    () =>
      this.currentHeros()?.traits?.filter(
        (item) => item.type === 'D' && item.carriere === true
      ) ?? []
  );
  readonly allHerosDesavantages = computed(
    () => this.currentHeros()?.traits?.filter((item) => item.type === 'D') ?? []
  );
  readonly heroismCost = computed(() => {
    const advantageCount = this.currentHeroAvantages().length;
    const regionalDisadvantageCount = this.currentHeroRegionalDesavantages().length;
    const generalDisadvantageCount = this.currentHeroGeneralDesavantages().length;
    const extraAdvantages = Math.max(advantageCount - 1, 0);

    let cost = 0;
    if (extraAdvantages >= 1 && regionalDisadvantageCount === 0) {
      cost += 1;
    }

    if (extraAdvantages >= 2 && generalDisadvantageCount === 0) {
      cost += 1;
    }

    return cost;
  });

  readonly regionalAvantages = computed(
    () =>
      this.currentHerosRegion()?.avantages?.map((item) => {
        return {
          ...item,
          ...{
            id: item.pivot.avantage_id,
            detail: item.pivot.detail,
            region_id: item.pivot.region_id,
          },
        };
      }) ?? []
  );
  readonly regionalDesavantages = computed(
    () =>
      this.currentHerosRegion()?.desavantages?.map((item) => {
        return {
          ...item,
          ...{
            id: item.pivot.desavantage_id,
            detail: item.pivot.detail,
            region_id: item.pivot.region_id,
          },
        };
      }) ?? []
  );

  readonly traitsModifiers = computed(() => {
    const modifiers: AttributModifier[] = [];
    this.currentHeroAvantages().forEach((trait) => {
        const trt = this.avantagesList()?.filter((item) => item.attribut !== null)?.find((item) => item.id === trait.traitable_id);
        if (trt?.attribut) {
          modifiers.push({attr: trt.attribut, value: trt.attribut_bonus ?? 0});
        }
    });
    this.currentHeroDesavantages().forEach((trait) => {
      const trt = this.desavantagesList()?.filter((item) => item.attribut !== null)?.find((item) => item.id === trait.traitable_id);
      if (trt?.attribut) {
        modifiers.push({attr: trt.attribut, value: trt.attribut_malus ?? 0});
      }
    });
    if (this.heroismCost() > 0) {
      modifiers.push({attr: 'heroisme', value: -this.heroismCost()});
    }
    // Vitalité = 10 + vigueur : la vigueur avec ses bonus de traits (Vigueur céruléenne : +1 vigueur, donc +1 vitalité).
    const bonusVigueur = modifiers.filter((modifier) => modifier.attr === 'vigueur').reduce((total, modifier) => total + Number(modifier.value), 0);
    const vigueur = (this.currentHeros()?.attributs.vigueur ?? 0) + bonusVigueur;
    if (vigueur !== 0) {
      modifiers.push({attr: 'vitalite', value: vigueur});
    }
    this.currentHerosCarrieres().forEach((carriere) => {
      // points de pouvoir = 10 + rang de sorcier ; création = rang d'alchimiste ; foi = rang de prêtre
      if (carriere.carriere_id === CARRIERE_SORCIER_ID) {
        modifiers.push({attr: 'pouvoir', value: 10 + carriere.value});
      }
      if (carriere.carriere_id === CARRIERE_ALCHIMISTE_ID && carriere.value !== 0) {
        modifiers.push({attr: 'creation', value: carriere.value});
      }
      if (carriere.carriere_id === CARRIERE_PRETRE_ID && carriere.value !== 0) {
        modifiers.push({attr: 'foi', value: carriere.value});
      }
    });
    // Maître artisan (Mythic+) : des points de création comme un alchimiste, au rang de forgeron — une réserve à part, pour les
    // armes, armures et outils, qui s'ajoute à celle d'un alchimiste.
    const forgeron = this.currentHerosCarrieres().find((carriere) => Number(carriere.carriere_id) === CARRIERE_FORGERON_ID)?.value ?? 0;
    if (forgeron > 0 && this.currentHeroAvantages().some((trait) => Number(trait.traitable_id) === AVANTAGE_MAITRE_ARTISAN_ID)) {
      modifiers.push({attr: 'creation', value: forgeron});
    }
    return modifiers;
  });

  readonly warnTraits = signal<HeroCreationWarning[]>([]);
  readonly warnAttrs = signal<HeroCreationWarning[]>([]);
  readonly warnCombat = signal<HeroCreationWarning[]>([]);
  readonly warnCarrieres = signal<HeroCreationWarning[]>([]);
  readonly warnOrigines = signal<HeroCreationWarning[]>([]);
  readonly warnLangues = signal<HeroCreationWarning[]>([]);
  readonly warnCount = computed(() =>
    this.warnTraits().length +
    this.warnAttrs().length +
    this.warnCombat().length +
    this.warnCarrieres().length +
    this.warnOrigines().length +
    this.warnLangues().length);

  setWarnTraits(traits: HeroCreationWarning[]) {
    this.warnTraits.set(traits);
  }
  setWarnAttrs(attrs: HeroCreationWarning[]) {
    this.warnAttrs.set(attrs);
  }
  setWarnCombat(combat: HeroCreationWarning[]) {
    this.warnCombat.set(combat);
  }
  setWarnOrigines(origines: HeroCreationWarning[]) {
    this.warnOrigines.set(origines);
  }
  setWarnCarrieres(carrieres: HeroCreationWarning[]) {
    this.warnCarrieres.set(carrieres);
  }
  setWarnLangues(langues: HeroCreationWarning[]) {
    this.warnLangues.set(langues);
  }
  clearWarnings() {
    this.warnTraits.set([]);
    this.warnAttrs.set([]);
    this.warnCombat.set([]);
    this.warnCarrieres.set([]);
    this.warnOrigines.set([]);
    this.warnLangues.set([]);
  }
}
