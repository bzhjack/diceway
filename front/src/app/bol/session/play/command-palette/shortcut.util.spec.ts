import {describe, expect, it} from 'vitest';
import {isEndTurnShortcut, isPaletteShortcut, ShortcutEvent} from './shortcut.util';

function key(k: string, mods: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return {key: k, ctrlKey: false, metaKey: false, altKey: false, ...mods};
}

describe('isPaletteShortcut', () => {
  it('opens on "/" when focus is not in a field', () => {
    expect(isPaletteShortcut(key('/'), null)).toBe(true);
    expect(isPaletteShortcut(key('/'), {tagName: 'BODY'})).toBe(true);
    expect(isPaletteShortcut(key('/'), {tagName: 'BUTTON'})).toBe(true);
  });

  it('ignores "/" typed in an input, a textarea, a select or an editable element', () => {
    expect(isPaletteShortcut(key('/'), {tagName: 'INPUT'})).toBe(false);
    expect(isPaletteShortcut(key('/'), {tagName: 'TEXTAREA'})).toBe(false);
    expect(isPaletteShortcut(key('/'), {tagName: 'SELECT'})).toBe(false);
    expect(isPaletteShortcut(key('/'), {tagName: 'DIV', isContentEditable: true})).toBe(false);
  });

  it('opens on Ctrl+K and Cmd+K, even from a field', () => {
    expect(isPaletteShortcut(key('k', {ctrlKey: true}), {tagName: 'INPUT'})).toBe(true);
    expect(isPaletteShortcut(key('K', {metaKey: true}), null)).toBe(true);
  });

  it('ignores other keys and other modifier combinations', () => {
    expect(isPaletteShortcut(key('k'), null)).toBe(false);
    expect(isPaletteShortcut(key('/', {ctrlKey: true}), null)).toBe(false);
    expect(isPaletteShortcut(key('k', {ctrlKey: true, altKey: true}), null)).toBe(false);
    expect(isPaletteShortcut(key('Escape'), null)).toBe(false);
  });
});

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
