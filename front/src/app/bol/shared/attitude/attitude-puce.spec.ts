import {TestBed} from '@angular/core/testing';
import {AttitudePuceComponent} from './attitude-puce';

describe('AttitudePuceComponent', () => {
  async function rendre(attitude: 'hostile' | 'diverses' | null) {
    const fixture = TestBed.createComponent(AttitudePuceComponent);
    fixture.componentRef.setInput('attitude', attitude);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('prend la couleur de l’attitude, sans rien dire aux lecteurs d’écran (le bouton qui la porte le dit)', async () => {
    const puce = await rendre('hostile');

    expect(puce.classList).toContain('apu--hostile');
    expect(puce.getAttribute('aria-hidden')).toBe('true');
  });

  it('un cercle sans attitude, une roue pour un groupe aux attitudes diverses', async () => {
    expect((await rendre(null)).classList).toContain('apu--aucune');
    expect((await rendre('diverses')).classList).toContain('apu--diverses');
  });
});
