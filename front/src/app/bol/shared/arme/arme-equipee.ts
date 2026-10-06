/** Une arme d'un héros, vue sous l'angle « équipée ou non ». Une arme sans drapeau (créée avant la notion, ou
 * « Mains nues » et « Arme improvisée », toujours disponibles) compte comme équipée. */
export interface ArmeEquipable {
  readonly equipee?: boolean;
}

export function isArmeEquipee(arme: ArmeEquipable): boolean {
  return arme.equipee !== false;
}

/** Les armes équipées, dans l'ordre d'origine. */
export function equippedArmes<T extends ArmeEquipable>(armes: readonly T[]): T[] {
  return armes.filter(isArmeEquipee);
}

interface ArmeAvecDegats extends ArmeEquipable {
  readonly arme?: {readonly degats?: string | null} | null;
}

/** Les dégâts de la première arme équipée qui en a — `null` si aucune. Les entrées dont le catalogue n'est pas
 * chargé (un simple id) sont ignorées. */
export function firstEquippedDegats(armes: readonly (ArmeAvecDegats | number)[] | undefined): string | null {
  for (const entry of armes ?? []) {
    if (typeof entry === 'object' && isArmeEquipee(entry) && entry.arme?.degats) {
      return entry.arme.degats;
    }
  }
  return null;
}
