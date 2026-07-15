import {computed, inject, Injectable, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {
  AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID,
  AVANTAGE_POUVOIR_DU_NEANT_ID,
  CARRIERE_ALCHIMISTE_ID,
  CARRIERE_PRETRE_ID,
  CARRIERE_SORCIER_ID,
  DESAVANTAGE_NON_COMBATTANT_ID,
} from '../bol-rules.constants';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolCatalogService} from './bol-catalog.service';

export interface HeroCreationWarning {
  step: string;
  warn: string;
}

export interface AttributModifier {
  attr: string;
  value: number;
}

@Injectable({
  providedIn: 'root',
})
export class BolHerosStateService {
  #catalog = inject(BolCatalogService);
  langueList = toSignal(this.#catalog.langues());
  armureList = toSignal(this.#catalog.armures());
  armeList = toSignal(this.#catalog.armes());
  regionList = toSignal(this.#catalog.regions());
  carriereList = toSignal(this.#catalog.carrieres());
  currentHeros = signal<BolHerosModel | null>(null);
  avantagesList = toSignal(this.#catalog.avantages());
  desavantagesList = toSignal(this.#catalog.desavantages());
  currentHerosCarrieres = computed(() => this.currentHeros()?.carrieres ?? []);

  // E11: Non-combattant modifie les budgets combat et carrières
  isNonCombattant = computed(() =>
    this.currentHeros()?.traits?.some(
      (t) => t.type === 'D' && t.carriere === false && t.traitable_id === DESAVANTAGE_NON_COMBATTANT_ID,
    ) ?? false,
  );
  combatBudget = computed(() => (this.isNonCombattant() ? 2 : 4));
  carriereBudget = computed(() => (this.isNonCombattant() ? 6 : 4));

  // E12: avantages spéciaux exigeant un désavantage supplémentaire
  specialAvantageDesavantageRequired = computed(() => {
    const ids = this.currentHeroAvantages().map((t) => t.traitable_id);
    return (
      (ids.includes(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID) ? 1 : 0) +
      (ids.includes(AVANTAGE_POUVOIR_DU_NEANT_ID) ? 1 : 0)
    );
  });

  carriereDesavantageCount = computed(() => {
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

  currentHerosRegion = computed(() =>
    this.regionList()?.find(
      (region) =>
        this.currentHeros()?.origines.region_id === region.id
    )
  );

  protected currentHeroAvantages = computed(
    () => this.currentHeros()?.traits?.filter((item) => item.type === 'A') ?? []
  );
  protected currentHeroDesavantages = computed(
    () =>
      this.currentHeros()?.traits?.filter(
        (item) => item.type === 'D' && item.carriere === false
      ) ?? []
  );
  protected currentHeroRegionalDesavantages = computed(
    () => this.currentHeroDesavantages().filter((item) => (item.region_id ?? 0) > 0) ?? []
  );
  protected currentHeroGeneralDesavantages = computed(
    () => this.currentHeroDesavantages().filter((item) => (item.region_id ?? 0) <= 0) ?? []
  );
  protected currentHeroCarriereDesvantages = computed(
    () =>
      this.currentHeros()?.traits?.filter(
        (item) => item.type === 'D' && item.carriere === true
      ) ?? []
  );
  allHerosDesavantages = computed(
    () => this.currentHeros()?.traits?.filter((item) => item.type === 'D') ?? []
  );
  heroismCost = computed(() => {
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

  regionalAvantages = computed(
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
  regionalDesavantages = computed(
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

  traitsModifiers = computed(() => {
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
    const vigueur = this.currentHeros()?.attributs.vigueur ?? 0;
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
    return modifiers;
  });

  warnTraits = signal<HeroCreationWarning[]>([]);
  warnAttrs = signal<HeroCreationWarning[]>([]);
  warnCombat = signal<HeroCreationWarning[]>([]);
  warnCarrieres = signal<HeroCreationWarning[]>([]);
  warnOrigines = signal<HeroCreationWarning[]>([]);
  warnLangues = signal<HeroCreationWarning[]>([]);
  warnCount = computed(() =>
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
