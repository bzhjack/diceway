import {describe, expect, it} from 'vitest';
import {scrollState, scrollTarget} from './dw-scroller.util';

describe('scrollState', () => {
  it('has no overflow when the content fits', () => {
    expect(scrollState(0, 400, 400)).toEqual({overflow: false, canBack: false, canForward: false});
  });

  it('can only go forward at the start of an overflowing track', () => {
    expect(scrollState(0, 1000, 400)).toEqual({overflow: true, canBack: false, canForward: true});
  });

  it('can go both ways in the middle', () => {
    expect(scrollState(300, 1000, 400)).toEqual({overflow: true, canBack: true, canForward: true});
  });

  it('can only go back at the end', () => {
    expect(scrollState(600, 1000, 400)).toEqual({overflow: true, canBack: true, canForward: false});
  });

  it('absorbs the sub-pixel rounding of browsers at both ends', () => {
    expect(scrollState(0.4, 1000, 400).canBack).toBe(false);
    expect(scrollState(599.6, 1000, 400).canForward).toBe(false);
    expect(scrollState(0, 400.5, 400).overflow).toBe(false);
  });
});

describe('scrollTarget', () => {
  // Quatre cartes de 100 px séparées de 10 px, positions comptées depuis la première ; piste visible de 250 px.
  const offsets = [0, 110, 220, 330];
  const scrollWidth = 446;
  const clientWidth = 250;

  it('moves forward to the left edge of the next card', () => {
    expect(scrollTarget(0, scrollWidth, clientWidth, 1, offsets)).toBe(110);
    expect(scrollTarget(110, scrollWidth, clientWidth, 1, offsets)).toBe(196);
  });

  it('moves back to the left edge of the previous card', () => {
    expect(scrollTarget(196, scrollWidth, clientWidth, -1, offsets)).toBe(110);
    expect(scrollTarget(110, scrollWidth, clientWidth, -1, offsets)).toBe(0);
  });

  it('goes from a position between two cards to the next one, not the one it already shows', () => {
    expect(scrollTarget(60, scrollWidth, clientWidth, 1, offsets)).toBe(110);
    expect(scrollTarget(60, scrollWidth, clientWidth, -1, offsets)).toBe(0);
  });

  it('never goes past either end', () => {
    expect(scrollTarget(196, scrollWidth, clientWidth, 1, offsets)).toBe(196);
    expect(scrollTarget(0, scrollWidth, clientWidth, -1, offsets)).toBe(0);
  });

  it('stays put when there is nothing to scroll or no card', () => {
    expect(scrollTarget(0, 200, clientWidth, 1, offsets)).toBe(0);
    expect(scrollTarget(0, scrollWidth, clientWidth, 1, [])).toBe(0);
  });
});
