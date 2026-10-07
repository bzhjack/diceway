/** Une langue à afficher dans la liste. */
export interface LangueEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly estLemurienne: boolean;
}
