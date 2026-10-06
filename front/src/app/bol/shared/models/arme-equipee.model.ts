/** Une arme d'un héros, vue sous l'angle « équipée ou non ». Une arme sans drapeau (créée avant la notion, ou
 * « Mains nues » et « Arme improvisée », toujours disponibles) compte comme équipée. */
export interface ArmeEquipable {
  readonly equipee?: boolean;
}
