import {Injectable} from '@angular/core';
import {EtatSlot, ReactionResult} from '../session-live/bol-combat-panel/bol-combat-panel';

export interface SlotState {
  vitaliteCourante: number;
  heroismCourant: number | null;
  category: ReactionResult | null;
  etats: EtatSlot[];
}

export interface CombatSnapshot {
  scenarioId: string;
  round: number;
  activeTurnId: string | null;
  delayedIds: string[];
  initiativeIds: string[];
  slotStates: Record<string, SlotState>;
}

@Injectable({providedIn: 'root'})
export class BolCombatStorageService {
  private key(scenarioId: string): string {
    return `bol-combat-${scenarioId}`;
  }

  save(scenarioId: string, snap: CombatSnapshot): void {
    try {
      sessionStorage.setItem(this.key(scenarioId), JSON.stringify(snap));
    } catch {}
  }

  load(scenarioId: string): CombatSnapshot | null {
    try {
      const raw = sessionStorage.getItem(this.key(scenarioId));
      return raw ? (JSON.parse(raw) as CombatSnapshot) : null;
    } catch {
      return null;
    }
  }

  clear(scenarioId: string): void {
    sessionStorage.removeItem(this.key(scenarioId));
  }
}
