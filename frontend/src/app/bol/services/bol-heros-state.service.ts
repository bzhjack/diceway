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

  heroismCost = signal<number>(0);

  currentHerosRegion = computed(() => this.regionList()?.find((region) => this.currentHeros()?.origines.region_id === region.id));
  regionalAvantages = computed(() => this.currentHerosRegion()?.avantages?.map((item) => {
    return {...item, ...{id: item.pivot.avantage_id, detail: item.pivot.detail, region_id: item.pivot.region_id}};
  }));
  regionalDesavantages = computed(() => this.currentHerosRegion()?.desavantages?.map(
    (item) => {
      return {...item, ...{id: item.pivot.desavantage_id, detail: item.pivot.detail, region_id: item.pivot.region_id}};
    }));

  constructor() {
    effect(() => {
      console.log('currentHero changed:', this.currentHeros());
    });
  }
}
