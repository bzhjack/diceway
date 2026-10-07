/** Un trait choisi dans le menu d'ajout : son id et son type. */
export interface TraitAddEvent {
  readonly id: number;
  readonly type: 'A' | 'D';
}
