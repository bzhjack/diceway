/** État des chevrons d'une piste qui défile : déborde-t-elle, et peut-on aller à gauche ou à droite. */
export interface ScrollState {
  /** Le contenu dépasse la zone visible : les chevrons sont utiles. */
  overflow: boolean;
  canBack: boolean;
  canForward: boolean;
}
