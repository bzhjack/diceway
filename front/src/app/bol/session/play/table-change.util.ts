import {BolFightSessionModel} from '../../models/bol-fight-session.model';
import {TableChange} from '../models/table-change.model';

/** La session une fois ce réglage appliqué, sans la redemander à l'API. */
export function applyTableChange(session: BolFightSessionModel | null, change: TableChange): BolFightSessionModel | null {
  if ('session' in change) {
    return change.session;
  }
  if (!session) {
    return null;
  }
  return {
    ...session,
    heros: session.heros?.map((row) =>
      row.heros_id === change.herosId && row.heros?.ressources
        ? {...row, heros: {...row.heros, ressources: {...row.heros.ressources, heroisme: change.heroisme}}}
        : row,
    ),
  };
}
