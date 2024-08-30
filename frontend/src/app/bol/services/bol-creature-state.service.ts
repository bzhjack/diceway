import {computed, effect, inject, Injectable, signal} from '@angular/core';
import {BolHerosService} from "./bol-heros.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolHerosModel} from "../models/bol-heros.model";
import {BolCreaturesService} from "./bol-creatures.service";

@Injectable({
  providedIn: 'root'
})
export class BolCreatureStateService {
  #bcs = inject(BolCreaturesService)
  tailleList = toSignal(this.#bcs.tailles());
}
