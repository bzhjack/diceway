export interface ScrollState {
  /** Le contenu dépasse la zone visible : les chevrons sont utiles. */
  overflow: boolean;
  canBack: boolean;
  canForward: boolean;
}
