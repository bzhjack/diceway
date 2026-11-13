import {describe, expect, it} from 'vitest';
import {isEndTurnShortcut} from './shortcut.util';
import {ShortcutEvent} from '../models/shortcut.model';

function key(k: string, mods: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return {key: k, ctrlKey: false, metaKey: false, altKey: false, ...mods};
}

describe('isEndTurnShortcut', () => {
  it('ends the turn on "f" or "F" outside a field', () => {
    expect(isEndTurnShortcut(key('f'), null)).toBe(true);
    expect(isEndTurnShortcut(key('F'), {tagName: 'BUTTON'})).toBe(true);
  });

  it('ignores "f" typed in a field', () => {
    expect(isEndTurnShortcut(key('f'), {tagName: 'INPUT'})).toBe(false);
    expect(isEndTurnShortcut(key('f'), {tagName: 'DIV', isContentEditable: true})).toBe(false);
  });

  it('ignores the auto-repeat of a key held down, so one press ends one turn', () => {
    expect(isEndTurnShortcut({...key('f'), repeat: true}, null)).toBe(false);
  });

  it('ignores "f" with a modifier, so Ctrl+F still searches the page', () => {
    expect(isEndTurnShortcut(key('f', {ctrlKey: true}), null)).toBe(false);
    expect(isEndTurnShortcut(key('f', {metaKey: true}), null)).toBe(false);
    expect(isEndTurnShortcut(key('f', {altKey: true}), null)).toBe(false);
  });
});
