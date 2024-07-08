import {inject, Injectable, signal} from '@angular/core';
import {BolCarriereModel} from "../models/bol-carriere.model";
import {Observable} from "rxjs";
import {BolHerosService} from "./bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class BolHerosStateService {
  #bhs = inject(BolHerosService)
  armureList = toSignal(this.#bhs.armures());

  constructor() {
  }
}
