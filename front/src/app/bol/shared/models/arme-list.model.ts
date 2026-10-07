/** Une arme à afficher dans la liste, avec son état équipé. */
export interface ArmeEntry {
  readonly id: number;
  readonly label: string;
  readonly degats: string | null;
  readonly portee: string | null;
  readonly notes: string | null;
  readonly equipee: boolean;
}
