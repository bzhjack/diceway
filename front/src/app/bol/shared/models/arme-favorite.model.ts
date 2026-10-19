/** L'avantage « Arme favorite » d'une fiche : l'arme nommée (`null` tant qu'elle n'est pas choisie), et la région qui l'impose
 * (`null` pour l'avantage général, dont l'arme se choisit). */
export interface ArmeFavoriteTrait {
  readonly arme: string | null;
  readonly regionId: number | null;
}

/** L'étoile « arme favorite » d'une arme de la liste : allumée ou non, et pourquoi elle ne peut pas changer (`null` : libre). */
export interface EtoileArme {
  readonly active: boolean;
  readonly raison: string | null;
}
