export interface Roll {
  critical: string | null;
  die: number;
  matched: boolean;
  order: number;
  roll: number;
  success: string | null;
  successes: number;
  failures: number;
  type: string;
  valid: boolean;
  value: number;
  drop?: boolean; // Optionnel car il n'apparaît pas toujours
}

export interface Die {
  type: string;
  value: number;
  success: string | null;
  successes: number;
  failures: number;
  valid: boolean;
  order: number;
}

export interface DiceRoll {
  count: Die;
  die: Die;
  rolls: Roll[];
  success: string | null;
  successes: number;
  failures: number;
  type: string;
  valid: boolean;
  value: number;
  order: number;
  matched: boolean;
}
