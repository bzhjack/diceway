/** Un choix de rang de PNJ : piétaille (`P`), coriace (`C`) ou rival (`R`). */
export interface PnjTypeOption {
  readonly label: string;
  readonly value: 'P' | 'C' | 'R';
}
