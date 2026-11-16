import {TestBed} from '@angular/core/testing';
import {RangComponent} from './rang';

describe('RangComponent', () => {
  async function rendre(rang: 'R' | 'C' | 'P') {
    const fixture = TestBed.createComponent(RangComponent);
    fixture.componentRef.setInput('rang', rang);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('dit le rang en toutes lettres, à sa couleur', async () => {
    const rival = await rendre('R');

    expect(rival.textContent).toBe('Rival');
    expect(rival.classList).toContain('rng--R');
    expect((await rendre('P')).textContent).toBe('Piétaille');
  });
});
