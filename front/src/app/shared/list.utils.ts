/** Recherche insensible à la casse sur plusieurs champs ; un terme vide matche tout. */
export function matchesTerm(term: string, ...values: (string | null | undefined)[]): boolean {
  const normalized = term.trim().toLocaleLowerCase();
  if (!normalized) {
    return true;
  }

  return values.some((value) => value?.toLocaleLowerCase().includes(normalized));
}

/** Comparateur : les éléments "à moi" d'abord, puis tri alphabétique sur le libellé. */
export function ownFirstThenLabel<T>(
  isOwn: (item: T) => boolean,
  label: (item: T) => string,
): (left: T, right: T) => number {
  return (left, right) => {
    const ownCompare = (isOwn(left) ? 0 : 1) - (isOwn(right) ? 0 : 1);
    if (ownCompare !== 0) {
      return ownCompare;
    }

    return label(left).localeCompare(label(right));
  };
}
