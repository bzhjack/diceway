/** Recherche insensible à la casse sur plusieurs champs ; un terme vide matche tout. */
export function matchesTerm(term: string, ...values: (string | null | undefined)[]): boolean {
  const normalized = term.trim().toLocaleLowerCase();
  if (!normalized) {
    return true;
  }

  return values.some((value) => value?.toLocaleLowerCase().includes(normalized));
}
