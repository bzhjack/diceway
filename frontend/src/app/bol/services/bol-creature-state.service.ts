import {inject, Injectable} from '@angular/core';
import {toSignal} from "@angular/core/rxjs-interop";
import {BolCreaturesService} from "./bol-creatures.service";

@Injectable({
  providedIn: 'root'
})
export class BolCreatureStateService {
  #bcs = inject(BolCreaturesService)
  tailleList = toSignal(this.#bcs.tailles());
  capaciteList = toSignal(this.#bcs.capacites());
}
