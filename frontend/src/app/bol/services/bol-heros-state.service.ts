import {inject, Injectable} from '@angular/core';
import {BolHerosService} from "./bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class BolHerosStateService {
  #bhs = inject(BolHerosService)
  armureList = toSignal(this.#bhs.armures());
  armeList = toSignal(this.#bhs.armes());
  regionList = toSignal(this.#bhs.regions());
  carriereList = toSignal(this.#bhs.carrieres());
  constructor() {
  }
}
