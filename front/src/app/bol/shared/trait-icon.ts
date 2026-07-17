export type TraitIcon = 'info' | 'attr' | 'd6';

interface TraitIconSource {
  readonly de_bonus?: boolean | null;
  readonly de_malus?: boolean | null;
  readonly attribut?: string | null;
}

/** Nom d'icône `mat-icon` par type : ligature Material Icons pour info/attr, SVG custom enregistrée pour d6 (cf. app.ts). */
const TRAIT_ICON_NAMES: Record<TraitIcon, string> = {
  d6: 'd6',
  attr: 'list_alt',
  info: 'info',
};

const SVG_TRAIT_ICONS: ReadonlySet<TraitIcon> = new Set(['d6']);

export function traitIconType(source: TraitIconSource | null | undefined): TraitIcon {
  if (source?.de_bonus || source?.de_malus) {
    return 'd6';
  }

  if (source?.attribut) {
    return 'attr';
  }

  return 'info';
}

export function traitIconName(icon: TraitIcon): string {
  return TRAIT_ICON_NAMES[icon];
}

export function traitIconIsSvg(icon: TraitIcon): boolean {
  return SVG_TRAIT_ICONS.has(icon);
}
