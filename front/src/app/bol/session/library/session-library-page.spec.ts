import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {of} from 'rxjs';
import {BolFightSessionSummaryModel} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {SessionLibraryPageComponent} from './session-library-page';

const SESSIONS: BolFightSessionSummaryModel[] = [
  {id: 'ouverte', titre: 'Ce soir', statut: 'libre', heros_count: 3, adversaires_count: 0},
  {id: 'close', titre: 'La semaine dernière', statut: 'terminee', heros_count: 3, adversaires_count: 2},
];

describe('SessionLibraryPageComponent', () => {
  async function rendre() {
    const reopen = vi.fn(() => of({}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolFightSessionService, useValue: {fightSessions: () => of(SESSIONS), reopen}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    const fixture = TestBed.createComponent(SessionLibraryPageComponent);
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    const ligne = (titre: string) => [...page.querySelectorAll('.cl-row')].find((row) => row.textContent?.includes(titre))!;
    const reprendre = (titre: string) => [...ligne(titre).querySelectorAll('button')].find((b) => b.textContent?.includes('Reprendre'))!;
    return {page, ligne, reprendre, reopen, navigate, fixture};
  }

  it('montre les tables closes avec les autres, en le disant', async () => {
    const {ligne} = await rendre();

    expect(ligne('La semaine dernière').textContent).toContain('Close');
    expect(ligne('Ce soir').textContent).not.toContain('Close');
  });

  it('rouvre une table close avant d’y retourner', async () => {
    const {reprendre, reopen, navigate} = await rendre();

    reprendre('La semaine dernière').click();

    expect(reopen).toHaveBeenCalledWith('close');
    expect(navigate).toHaveBeenCalledWith(['/session', 'close', 'play']);
  });

  it('retourne à une table ouverte sans la toucher', async () => {
    const {reprendre, reopen, navigate} = await rendre();

    reprendre('Ce soir').click();

    expect(reopen).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/session', 'ouverte', 'play']);
  });
});
