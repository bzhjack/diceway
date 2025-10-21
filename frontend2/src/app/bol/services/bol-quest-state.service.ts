import {Injectable, signal} from '@angular/core';
import {BolQuestModel} from '../models/bol-quest.model';

@Injectable({
  providedIn: 'root'
})
export class BolQuestStateService {
  questState = signal<BolQuestModel | null>(null);

  constructor() { }
}
