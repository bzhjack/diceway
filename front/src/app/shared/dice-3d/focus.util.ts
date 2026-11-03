/** Nombre d'images à attendre au plus que le bouton du lancer soit réactivé (une demi-seconde environ). */
const ESSAIS_MAX = 30;

/**
 * Rend le focus à l'élément qui l'avait avant un lancer de dés. Son bouton est désactivé pendant le lancer et le navigateur envoie
 * alors le focus sur `body` : au clavier, on perdait sa place (et Échap ne dégageait plus les dés). On attend qu'il soit réactivé,
 * et on ne reprend pas un focus que l'utilisateur a mis ailleurs entre-temps.
 */
export function rendreLeFocus(cible: Element | null): void {
  if (!(cible instanceof HTMLElement) || cible === document.body) {
    return;
  }
  let essais = 0;
  const essayer = (): void => {
    const actif = document.activeElement;
    if (actif && actif !== document.body) {
      return;
    }
    if (!cible.isConnected) {
      return;
    }
    if (!(cible as HTMLButtonElement).disabled) {
      cible.focus();
      return;
    }
    if (++essais < ESSAIS_MAX) {
      requestAnimationFrame(essayer);
    }
  };
  requestAnimationFrame(essayer);
}
