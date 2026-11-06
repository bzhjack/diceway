import {TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {AfterCombatDialogData} from '../../models/after-combat-dialog.model';
import {AfterCombatDialogComponent} from './after-combat-dialog';

describe('AfterCombatDialogComponent', () => {
  async function ouvrir(data: AfterCombatDialogData): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: MatDialogRef, useValue: {close: vi.fn()}},
      ],
    });
    const fixture = TestBed.createComponent(AfterCombatDialogComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const boutons = (page: HTMLElement) => [...page.querySelectorAll('mat-dialog-actions button')].map((b) => texte(b));

  it('sans issue, c’est « Après combat », et « Annuler » laisse le combat en cours', async () => {
    const page = await ouvrir({wounded: [], healers: []});

    expect(texte(page.querySelector('.acd-title'))).toContain('Après combat');
    expect(page.querySelector('.acd-issue')).toBeNull();
    expect(boutons(page)).toEqual(['Annuler', 'Terminer le combat']);
  });

  it('une victoire le dit en tête, et « Continuer » laisse le temps de secourir', async () => {
    const page = await ouvrir({wounded: [], healers: [], outcome: 'victoire', mourants: []});

    expect(texte(page.querySelector('.acd-title'))).toContain('Victoire');
    expect(texte(page.querySelector('.acd-issue'))).toBe('Plus aucun adversaire ne tient debout.');
    expect(page.querySelector('.acd-warn')).toBeNull();
    expect(boutons(page)).toEqual(['Continuer', 'Terminer le combat']);
  });

  it('une défaite le dit, et nomme les mourants qu’on peut encore secourir', async () => {
    const page = await ouvrir({wounded: [], healers: [], outcome: 'defaite', mourants: ['Axel', 'jean']});

    expect(texte(page.querySelector('.acd-title'))).toContain('Défaite');
    expect(page.querySelector('.acd-title')?.classList).toContain('acd-title--defaite');
    expect(texte(page.querySelector('.acd-issue'))).toBe('Plus aucun héros ni allié ne tient debout.');
    expect(texte(page.querySelector('.acd-warn'))).toContain('Encore mourants : Axel, jean');
  });

  it('ne parle pas de session à l’écran', async () => {
    const page = await ouvrir({wounded: [], healers: []});

    expect(page.textContent).not.toContain('session');
  });
});
