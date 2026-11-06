import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideRouter} from '@angular/router';
import {AuthService} from '../../../core/auth/auth.service';
import {AccountMenuComponent} from './account-menu';

describe('AccountMenuComponent', () => {
  async function ouvrir(): Promise<string[]> {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [provideRouter([]), {provide: AuthService, useValue: {user: signal({name: 'Lionel'}), logout: vi.fn()}}],
    });
    const fixture = TestBed.createComponent(AccountMenuComponent);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    await fixture.whenStable();
    return [...document.querySelectorAll('.mat-mdc-menu-item')].map((item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  }

  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = '')));

  it('propose de changer de partie ou d’en créer une, jamais de clore', async () => {
    const items = await ouvrir();

    expect(items).toContain('swap_horizChanger de partie');
    expect(items).toContain('addNouvelle partie');
    expect(items.some((item) => item.includes('Clore'))).toBe(false);
  });
});
