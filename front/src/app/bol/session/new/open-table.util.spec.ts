import {describe, expect, it} from 'vitest';
import {enumerer} from './open-table.util';

describe('enumerer', () => {
  it('dit les noms en toutes lettres', () => {
    expect(enumerer([])).toBe('');
    expect(enumerer(['Axel'])).toBe('Axel');
    expect(enumerer(['Axel', 'jean'])).toBe('Axel et jean');
    expect(enumerer(['Axel', 'jadawin', 'Balaram', 'jean'])).toBe('Axel, jadawin, Balaram et jean');
  });
});
