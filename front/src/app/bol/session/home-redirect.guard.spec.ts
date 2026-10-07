import {describe, expect, it} from 'vitest';
import {BolFightSessionModel} from '../models/bol-fight-session.model';
import {openSessionId} from './home-redirect.guard';

function session(id: string | null, statut: BolFightSessionModel['statut']): BolFightSessionModel {
  return {id, titre: null, statut};
}

describe('openSessionId', () => {
  it('returns null when there is no session at all', () => {
    expect(openSessionId([])).toBeNull();
  });

  it('returns the first open session, the list being sorted most recent first', () => {
    expect(openSessionId([session('b', 'libre'), session('a', 'combat')])).toBe('b');
  });

  it('treats a session in combat as open', () => {
    expect(openSessionId([session('a', 'combat')])).toBe('a');
  });

  it('skips closed sessions', () => {
    expect(openSessionId([session('z', 'terminee'), session('a', 'libre')])).toBe('a');
    expect(openSessionId([session('z', 'terminee')])).toBeNull();
  });

  it('skips an open session without an id instead of redirecting to /session/null/play', () => {
    expect(openSessionId([session(null, 'libre')])).toBeNull();
    expect(openSessionId([session(null, 'libre'), session('a', 'libre')])).toBe('a');
  });
});
