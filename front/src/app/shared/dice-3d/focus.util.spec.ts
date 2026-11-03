import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {rendreLeFocus} from './focus.util';

describe('rendreLeFocus', () => {
  let bouton: HTMLButtonElement;

  beforeEach(() => {
    vi.useFakeTimers({toFake: ['requestAnimationFrame']});
    bouton = document.createElement('button');
    document.body.appendChild(bouton);
  });

  afterEach(() => {
    bouton.remove();
    vi.useRealTimers();
  });

  it('rend le focus au bouton du lancer une fois qu’il est réactivé', () => {
    // Pendant le lancer, le bouton est désactivé et le navigateur renvoie le focus sur body.
    bouton.focus();
    bouton.blur();
    bouton.disabled = true;

    rendreLeFocus(bouton);
    vi.advanceTimersToNextFrame();
    expect(document.activeElement).toBe(document.body);

    bouton.disabled = false;
    vi.advanceTimersToNextFrame();
    expect(document.activeElement).toBe(bouton);
  });

  it('ne reprend pas le focus que l’utilisateur a mis ailleurs', () => {
    const autre = document.createElement('input');
    document.body.appendChild(autre);
    autre.focus();

    rendreLeFocus(bouton);
    vi.advanceTimersToNextFrame();

    expect(document.activeElement).toBe(autre);
    autre.remove();
  });

  it('ne fait rien sans élément à qui le rendre', () => {
    expect(() => rendreLeFocus(null)).not.toThrow();
    expect(() => rendreLeFocus(document.body)).not.toThrow();
  });
});
