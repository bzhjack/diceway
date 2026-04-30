import {ParticipantType, ReactionResult} from './bol-combat-panel';

export const TYPE_LABELS: Record<ParticipantType, string> = {
  hero: 'PJ',
  creature: 'Créature',
  demon: 'Démon',
  pnj: 'PNJ',
};

export const CATEGORY_LABELS: Record<ReactionResult, string> = {
  legendaire: 'Légendaire ★★',
  heroique: 'Héroïque ★',
  reussite: 'Réussite',
  rival: 'Rival',
  coriace: 'Coriace',
  echec: 'Échec',
  pietaille: 'Piétaille',
  'echec-critique': 'Échec critique',
};

export const INITIATIVE_ORDER: Record<ReactionResult, number> = {
  legendaire: 0,
  heroique: 1,
  reussite: 2,
  rival: 3,
  coriace: 4,
  echec: 5,
  pietaille: 6,
  'echec-critique': 7,
};
