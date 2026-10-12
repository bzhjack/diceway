/** Stats de combat entièrement résolues (héros récupéré en direct si besoin), prêtes à préremplir le dialog d'attaque. */
export interface ResolvedCombatStats {
  readonly agilite: number;
  readonly vigueur: number;
  readonly melee: number;
  readonly tir: number;
  /** Bonus d'attaque combiné des créatures (remplace agilité+mêlée). */
  readonly attaque: number | null;
  readonly defense: number;
  readonly degats: string;
  readonly protection: number;
  /** Protection telle que le livre l'écrit (« d6-1 (3) », avec « +1 » si un casque est équipé) ; `null` sans protection. */
  readonly protectionText: string | null;
  /** Malus du petit bouclier ("-1 à une attaque subie par round") — 0 si absent ou déjà replié
   * dans `defense` (cas du grand bouclier, portée "toutes"). Consommé manuellement par le dialog
   * d'attaque, l'app ne suivant pas de round. */
  readonly bouclierMalusUneAttaque: number;
  /** null pour pnj/créature/démon — l'héroïsme (Faveur divine, options héroïques) n'existe que pour un héros. */
  readonly herosId: string | null;
  readonly heroisme: number | null;
}
