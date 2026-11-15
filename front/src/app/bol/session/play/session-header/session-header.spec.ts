import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideRouter} from '@angular/router';
import {SessionHeaderComponent} from './session-header';

describe('SessionHeaderComponent', () => {
  async function rendre(mode: 'libre' | 'combat'): Promise<HTMLElement> {
    TestBed.configureTestingModule({imports: [MatIconTestingModule], providers: [provideRouter([])]});
    const fixture = TestBed.createComponent(SessionHeaderComponent);
    fixture.componentRef.setInput('mode', mode);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const retour = (page: HTMLElement) => [...page.querySelectorAll('a')].find((a) => a.textContent?.includes("Retour à l'accueil")) ?? null;

  it('hors combat, le retour à l’accueil est un bouton or, avec son libellé', async () => {
    const lien = retour(await rendre('libre'))!;

    expect(lien.getAttribute('href')).toBe('/');
    expect(lien.hasAttribute('mat-flat-button')).toBe(true);
    expect(lien.querySelector('mat-icon')?.textContent?.trim()).toBe('arrow_back');
  });

  it('pas de menu du compte sur la table', async () => {
    expect((await rendre('libre')).querySelector('bol-account-menu')).toBeNull();
  });

  it('en combat, pas de retour à l’accueil : « Terminer » ramène à la table', async () => {
    const page = await rendre('combat');

    expect(retour(page)).toBeNull();
    expect(page.textContent).toContain('Terminer');
  });
});
