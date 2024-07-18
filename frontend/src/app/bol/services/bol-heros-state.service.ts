import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {BolHerosService} from "./bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHerosModel} from "../models/bol-heros.model";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class BolHerosStateService {
  #bhs = inject(BolHerosService)

  armureList = toSignal(this.#bhs.armures());
  armeList = toSignal(this.#bhs.armes());
  regionList = toSignal(this.#bhs.regions());
  carriereList = toSignal(this.#bhs.carrieres());
  currentHeros = signal<BolHerosModel | null>(null)
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
    return countDesavantage;
  });

  currentHerosRegion = computed(() => this.regionList()?.find((region) => this.currentHeros()?.origines.region_id === region.id));
  heroismCost = computed(() => Math.max(this.currentHeroAvantages().length - this.currentHeroDesavantages().length -1, 0) );

  protected currentHeroAvantages = computed(() => this.currentHeros()?.traits?.filter((item) => item.type === 'A') ?? [])
  protected currentHeroDesavantages = computed(() => this.currentHeros()?.traits?.filter((item) => item.type === 'D' && item.carriere === false) ?? [])
  protected currentHeroCarriereDesvantages = computed(() => this.currentHeros()?.traits?.filter((item) => item.type === 'D' && item.carriere === true) ?? [])


  regionalAvantages = computed(() => this.currentHerosRegion()?.avantages?.map((item) => {
    return {...item, ...{id: item.pivot.avantage_id, detail: item.pivot.detail, region_id: item.pivot.region_id}};
  }) ?? []);
  regionalDesavantages = computed(() => this.currentHerosRegion()?.desavantages?.map(
    (item) => {
      return {...item, ...{id: item.pivot.desavantage_id, detail: item.pivot.detail, region_id: item.pivot.region_id}};
    }) ?? []);

  constructor() {
    effect(() => {
      console.log('currentHero changed:', this.currentHeros());
    });
  }
}
