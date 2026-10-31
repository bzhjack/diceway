import {inject, Injectable} from '@angular/core';
import {toSignal} from "@angular/core/rxjs-interop";
import {BolCreaturesService} from "./bol-creatures.service";

@Injectable({
  providedIn: 'root'
})
export class BolCreatureStateService {
  #bcs = inject(BolCreaturesService)
  readonly tailleList = toSignal(this.#bcs.tailles());
  readonly capaciteList = toSignal(this.#bcs.capacites());
}
