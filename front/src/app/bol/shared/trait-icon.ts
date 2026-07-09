export type TraitIcon = 'info' | 'attr' | 'd6';

interface TraitIconSource {
  readonly de_bonus?: boolean | null;
  readonly de_malus?: boolean | null;
  readonly attribut?: string | null;
}

const TRAIT_ICON_PATHS: Record<TraitIcon, string> = {
  d6: '/assets/d6.svg',
  attr: '/assets/attr.svg',
  info: '/assets/info.svg',
};

export function traitIconType(source: TraitIconSource | null | undefined): TraitIcon {
  if (source?.de_bonus || source?.de_malus) {
    return 'd6';
  }

  if (source?.attribut) {
    return 'attr';
  }

  return 'info';
}

export function traitIconPath(icon: TraitIcon): string {
  return TRAIT_ICON_PATHS[icon];
}
