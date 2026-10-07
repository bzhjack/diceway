/** Entrée de FormArray référençant un élément de catalogue par id. */
export interface IdDraft {
  id: number;
}

/** Entrée avec rang (carrières). */
export interface RankedDraft extends IdDraft {
  value: number;
}

/** Entrée d'armure avec son état "équipé" (armure/bouclier/casque actif vs juste en inventaire). */
export interface ArmureDraft extends IdDraft {
  equipee: boolean;
}

/** Entrée d'arme avec son état "équipée" (en main vs juste en inventaire). */
export interface ArmeDraft extends IdDraft {
  equipee: boolean;
}

/** Entrée avec détail libre (pouvoirs, capacités). */
export interface DetailDraft extends IdDraft {
  detail: string | null;
}
