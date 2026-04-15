import {inject, Injectable} from '@angular/core';
import {toSignal} from "@angular/core/rxjs-interop";
import {BolDemonsService} from "./bol-demons.service";

@Injectable({
  providedIn: 'root'
})
export class BolDemonStateService {
  #bds = inject(BolDemonsService)
  categorieList = toSignal(this.#bds.categories());
  pouvoirList = toSignal(this.#bds.pouvoirs());
}
