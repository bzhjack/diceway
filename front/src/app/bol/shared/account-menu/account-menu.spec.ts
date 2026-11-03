import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideRouter, Router} from '@angular/router';
import {of} from 'rxjs';
import {AuthService} from '../../../core/auth/auth.service';
import {CloseTableService} from '../close-table/close-table.service';
import {TableAClore} from '../models/close-table.model';
import {AccountMenuComponent} from './account-menu';

describe('AccountMenuComponent', () => {
  async function ouvrir(table: TableAClore | null, close = true) {
    const clore = vi.fn(() => of(close));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: AuthService, useValue: {user: signal({name: 'Lionel'}), logout: vi.fn()}},
        {provide: CloseTableService, useValue: {clore}},
      ],
    });
    const fixture = TestBed.createComponent(AccountMenuComponent);
    fixture.componentRef.setInput('table', table);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector('button')!.click();
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const item = [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')].find((b) => b.textContent?.includes('Clore la table')) ?? null;
    return {item, clore, navigate, fixture};
  }

  afterEach(() => document.querySelectorAll('.cdk-overlay-container').forEach((c) => (c.innerHTML = '')));

  it('ne propose pas de clore une table hors de la table', async () => {
    const {item} = await ouvrir(null);

    expect(item).toBeNull();
  });

  it('clôt la table, puis ramène à l’accueil', async () => {
    const {item, clore, navigate} = await ouvrir({id: 't1', enCombat: true});

    item!.click();

    expect(clore).toHaveBeenCalledWith({id: 't1', enCombat: true});
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('reste à la table si le MJ renonce', async () => {
    const {item, navigate} = await ouvrir({id: 't1', enCombat: false}, false);

    item!.click();

    expect(navigate).not.toHaveBeenCalled();
  });
});
