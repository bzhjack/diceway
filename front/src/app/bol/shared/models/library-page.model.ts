/** Ce qu'une bibliothèque dit quand on supprime une de ses fiches. */
export interface LibraryDeleteTexts<TItem> {
  readonly title: string;
  readonly name: (item: TItem) => string;
  /** Ce que la suppression entraîne ailleurs, à dire avant de confirmer. */
  readonly consequence?: string;
  readonly error: string;
}
