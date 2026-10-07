import {defaultCamp} from './reserve-placement.service';

describe('defaultCamp', () => {
  it('place un héros chez les héros', () => {
    expect(defaultCamp('hero')).toBe('heros');
  });

  it('place les autres types dans la scène, comme présents', () => {
    expect(defaultCamp('pnj')).toBe('adversaires');
    expect(defaultCamp('creature')).toBe('adversaires');
    expect(defaultCamp('demon')).toBe('adversaires');
  });
});
