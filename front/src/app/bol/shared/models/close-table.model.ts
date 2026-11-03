/** Une table que « Clore la table » peut clore : en combat, la clore termine d'abord le combat. */
export interface TableAClore {
  readonly id: string;
  readonly enCombat: boolean;
}
