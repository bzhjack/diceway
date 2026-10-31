/** Ce qu'un catalogue d'équipement dit de ses entrées : les textes qui changent entre les armes et les armures. */
export interface EquipmentLibraryTexts<TItem> {
  readonly newTitle: string;
  readonly editTitle: string;
  readonly deleteTitle: string;
  readonly name: (item: TItem) => string;
  readonly saveError: string;
  readonly deleteError: string;
}
