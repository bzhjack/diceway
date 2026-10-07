/** Suit la dernière valeur envoyée au serveur pour un compteur piloté par stepper (vitalité) et
 * calcule le delta du prochain envoi. `take` mémorise la nouvelle valeur immédiatement, sans attendre
 * la réponse : deux clics rapides envoient deux deltas de 1, pas 1 puis 2. */
export class ValueTracker {
  private last: number;

  constructor(initial = 0) {
    this.last = initial;
  }

  get value(): number {
    return this.last;
  }

  reset(value: number): void {
    this.last = value;
  }

  take(next: number): number {
    const delta = next - this.last;
    this.last = next;
    return delta;
  }
}
