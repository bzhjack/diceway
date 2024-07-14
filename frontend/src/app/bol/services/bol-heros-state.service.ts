import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {BolHerosService} from "./bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHerosModel} from "../models/bol-heros.model";

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

  currentHerosRegion = computed(() => this.regionList()?.find((region) => this.currentHeros()?.origines.region_id === region.id));
  regionalAvantages = computed(() => this.currentHerosRegion()?.avantages);
  regionalDesavantages = computed(() => this.currentHerosRegion()?.desavantages);

  constructor() {
    effect(() => {
      console.log('currentHero changed:', this.currentHeros());
      //console.log('currentRegion changed:', this.currentHerosRegion());
    });
  }
}
