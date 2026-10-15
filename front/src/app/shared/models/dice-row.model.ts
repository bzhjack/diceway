/** Un dé d'une ligne de dés : sa face, et s'il est écarté (dé de bonus ou de malus, d6M ou d6B). */
export interface DiceRowDie {
  readonly value: number;
  readonly dropped?: boolean;
}
