import {describe, expect, it} from 'vitest';
import {ValueTracker} from './value-tracker';

describe('ValueTracker', () => {
  it('returns the delta from the initial value', () => {
    const tracker = new ValueTracker(9);
    expect(tracker.take(8)).toBe(-1);
  });

  it('counts each rapid step once, even before the server has answered', () => {
    const tracker = new ValueTracker(9);
    expect(tracker.take(8)).toBe(-1);
    expect(tracker.take(7)).toBe(-1);
    expect(tracker.value).toBe(7);
  });

  it('returns 0 when the value has not changed', () => {
    const tracker = new ValueTracker(5);
    expect(tracker.take(5)).toBe(0);
  });

  it('starts again from the value given to reset', () => {
    const tracker = new ValueTracker(9);
    tracker.take(7);
    tracker.reset(9);
    expect(tracker.take(10)).toBe(1);
  });
});
