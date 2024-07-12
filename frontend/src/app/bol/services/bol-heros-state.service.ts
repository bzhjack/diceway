import {effect, inject, Injectable, signal} from '@angular/core';
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
  herosState = signal<BolHerosModel | null>(null)

  constructor() {
    effect(() => {
      console.log('herosState changed:' , this.herosState());
    });
  }
}
