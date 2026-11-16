import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {CombatantAttitude} from '../../models/bol-fight-session.model';
import {AttitudeMenuComponent} from './attitude-menu';

describe('AttitudeMenuComponent', () => {
  it('la pastille dit l’attitude ; son menu en choisit une autre, ou aucune', async () => {
    TestBed.configureTestingModule({imports: [MatIconTestingModule]});
    const fixture = TestBed.createComponent(AttitudeMenuComponent);
    fixture.componentRef.setInput('attitude', 'mefiant');
    fixture.componentRef.setInput('nom', 'Loup');
    const choix: (CombatantAttitude | null)[] = [];
    fixture.componentInstance.choisie.subscribe((a) => choix.push(a));
    await fixture.whenStable();

    const bouton = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')!;
    expect(bouton.getAttribute('aria-label')).toBe('Attitude de Loup : Méfiant');
    expect(bouton.querySelector('bol-attitude-puce')?.classList).toContain('apu--mefiant');
    bouton.click();
    await fixture.whenStable();
    const items = [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
    items.find((b) => b.textContent?.includes('Amical'))!.click();
    expect(choix).toEqual(['amical']);
  });
});
