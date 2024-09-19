import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {BolHerosService} from './bol-heros.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {BolHerosModel} from '../models/bol-heros.model';

@Injectable({
  providedIn: 'root',
})
export class BolHerosStateService {
  #bhs = inject(BolHerosService);
  langueList = toSignal(this.#bhs.langues());
  armureList = toSignal(this.#bhs.armures());
  armeList = toSignal(this.#bhs.armes());
  regionList = toSignal(this.#bhs.regions());
  carriereList = toSignal(this.#bhs.carrieres());
  currentHeros = signal<BolHerosModel | null>(null);
  avantagesList = toSignal(this.#bhs.avantages());
  desavantagesList = toSignal(this.#bhs.desavantages());
  currentHerosCarrieres = computed(() => this.currentHeros()?.carrieres ?? []);

  carriereDesavangeCount = computed(() => {
    let countDesavantage = 0;
    this.currentHerosCarrieres().forEach((carriere) => {
      switch (carriere.carriere_id) {
        // 1 : Alchimiste ( au dessus rang 2)
        case 1:
          countDesavantage += Math.max(carriere.value - 2, 0);
          break;
        // 24: Sorcier (au dessus rang 1)
        case 24:
          countDesavantage += Math.max(carriere.value - 1, 0);
          break;
      }
    });
    return Math.max(countDesavantage - this.currentHeroCarriereDesvantages().length, 0);
  });

  currentHerosRegion = computed(() =>
    this.regionList()?.find(
      (region) =>
        Number(this.currentHeros()?.origines.region_id) === Number(region.id)
    )
  );
  heroismCost = computed(() => Math.max(this.currentHeroAvantages().length - this.currentHeroDesavantages().length - 1, 0));

  protected currentHeroAvantages = computed(
    () => this.currentHeros()?.traits?.filter((item) => item.type === 'A') ?? []
  );
  protected currentHeroDesavantages = computed(
    () =>
      this.currentHeros()?.traits?.filter(
        (item) => item.type === 'D' && item.carriere === false
      ) ?? []
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

  regionalAvantages = computed(
    () =>
      this.currentHerosRegion()?.avantages?.map((item) => {
        return {
          ...item,
          ...{
            id: Number(item.pivot.avantage_id),
            detail: item.pivot.detail,
            region_id: Number(item.pivot.region_id),
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
            id: Number(item.pivot.desavantage_id),
            detail: item.pivot.detail,
            region_id: Number(item.pivot.region_id),
          },
        };
      }) ?? []
  );

  traitsModifiers = computed(() => {
    const modifiers: any[] = [];
    this.currentHeroAvantages().map((trait) => {
        const trt = this.avantagesList()?.filter((item) => item.attribut !== null)?.find((item) => Number(item.id) === Number(trait.traitable_id));
        if (trt) {
          modifiers.push({attr:trt.attribut, value: Number(trt.attribut_bonus)});
        }
    });
    this.currentHeroDesavantages().map((trait) => {
      const trt = this.desavantagesList()?.filter((item) => item.attribut !== null)?.find((item) => Number(item.id) === Number(trait.traitable_id));
      if (trt) {
        modifiers.push({attr:trt.attribut, value: Number(trt.attribut_malus)});
      }
    });
    if (this.heroismCost() > 0) {
      modifiers.push({attr: 'heroisme', value: Number(this.heroismCost()) * -1});
    }
    this.currentHerosCarrieres().forEach((carriere) => {
      // 24: sorcier, 1: alchimiste, 21: pretre/druide
      // points de créations = rang d'alchimiste
      // points de pouvoir = 10 + rang de sorcier
      // point de foi = rang pretre.
      if (carriere.carriere_id === 24) {
        modifiers.push({attr: 'pouvoir', value: 10 + Number(carriere.value) });
      }
      if (carriere.carriere_id === 1 && Number(carriere.value) !== 0) {
        modifiers.push({attr: 'creation', value: Number(carriere.value) });
      }
      if (carriere.carriere_id === 21 && Number(carriere.value) !== 0) {
        modifiers.push({attr: 'foi', value: Number(carriere.value) });
      }
    });
    return modifiers;
  });

  warnTraits = signal([]);
  warnAttrs = signal([]);
  warnCombat = signal([]);
  warnCarrieres = signal([]);
  warnOrigines = signal([]);
  warnCount= computed(() =>
    this.warnTraits().length +
    this.warnAttrs().length +
    this.warnCombat().length +
    this.warnCarrieres().length +
    this.warnOrigines().length);
  constructor() {
    effect(() => {
      console.log('currentHero changed:', this.currentHeros());
    });
  }

  setWarnTraits(traits: any) {
    this.warnTraits.set(traits);
  }
  setWarnAttrs(attr: any) {
    this.warnAttrs.set(attr);
  }
  setWarnCombat(combat: any) {
    this.warnCombat.set(combat);
  }
  setWarnOrigines(origines: any) {
    this.warnOrigines.set(origines);
  }
  setwarnCarrieres(carrieres: any) {
    this.warnCarrieres.set(carrieres);
  }
}
