import {prefixPortraitsInPlace} from './portrait-url.interceptor';

const API = 'https://api.diceway.com';
const PORTRAIT = '/api/bol/portraits/abc.png';

describe('prefixPortraitsInPlace', () => {
  it('donne le domaine de l’API aux portraits, à toutes les profondeurs', () => {
    const body = {
      heros: [{heros: {origines: {avatar: PORTRAIT}}}],
      creatures: [{creature: {avatar: PORTRAIT}}],
    };

    prefixPortraitsInPlace(body, API);

    expect(body.heros[0].heros.origines.avatar).toBe(API + PORTRAIT);
    expect(body.creatures[0].creature.avatar).toBe(API + PORTRAIT);
  });

  it('laisse les autres images et les autres champs', () => {
    const body = {avatar: '/assets/bol/empty-avatar.jpg', ancien: {avatar: 'data:image/png;base64,AAAA'}, sansPortrait: {avatar: null}, commentaire: PORTRAIT};

    prefixPortraitsInPlace(body, API);

    expect(body).toEqual({avatar: '/assets/bol/empty-avatar.jpg', ancien: {avatar: 'data:image/png;base64,AAAA'}, sansPortrait: {avatar: null}, commentaire: PORTRAIT});
  });

  it('ne double pas un domaine déjà donné', () => {
    const body = {avatar: API + PORTRAIT};

    prefixPortraitsInPlace(body, API);

    expect(body.avatar).toBe(API + PORTRAIT);
  });
});
