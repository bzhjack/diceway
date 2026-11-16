import {TestBed} from '@angular/core/testing';
import {CoeurComponent} from './coeur';

describe('CoeurComponent', () => {
  async function rendre(valeur: number | string | null, etat: 'basse' | 'tombe' | null = null) {
    const fixture = TestBed.createComponent(CoeurComponent);
    fixture.componentRef.setInput('valeur', valeur);
    fixture.componentRef.setInput('etat', etat);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('écrit la vitalité dans le cœur, cachée aux lecteurs d’écran (le parent la dit)', async () => {
    const coeur = await rendre(11);

    expect(coeur.querySelector('b')?.textContent).toBe('11');
    expect(coeur.querySelector('b')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('un cœur vide sans valeur ; plus sombre la vitalité basse, gris à terre', async () => {
    expect((await rendre(null)).querySelector('b')).toBeNull();
    expect((await rendre(2, 'basse')).classList).toContain('coeur--bas');
    expect((await rendre(0, 'tombe')).classList).toContain('coeur--tombe');
  });
});
