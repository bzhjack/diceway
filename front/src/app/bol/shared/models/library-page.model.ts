/** Ce qu'une bibliothèque dit quand on supprime une de ses fiches. */
export interface LibraryDeleteTexts<TItem> {
  readonly title: string;
  readonly name: (item: TItem) => string;
  readonly error: string;
}
