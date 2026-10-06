export interface StatCell {
  readonly control: string;
  readonly label: string;
  readonly highlight?: boolean;
}

export interface StatGroup {
  readonly key: 'attr' | 'combat' | 'res';
  readonly label: string;
  readonly columns: 1 | 2 | 3 | 4;
  readonly cells: readonly StatCell[];
}
