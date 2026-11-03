/** Des noms en toutes lettres : « Axel », « Axel et jean », « Axel, jadawin, Balaram et jean » ; rien sans nom. */
export function enumerer(noms: readonly string[]): string {
  if (noms.length < 2) {
    return noms.join('');
  }
  return `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]}`;
}
