import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {of} from 'rxjs';
import {BolFightSessionSummaryModel} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {SessionLibraryPageComponent} from './session-library-page';

const SESSIONS: BolFightSessionSummaryModel[] = [
  {id: 'ouverte', titre: 'Ce soir', statut: 'libre', heros_count: 3, adversaires_count: 0},
  {id: 'close', titre: 'La semaine dernière', statut: 'libre', heros_count: 3, adversaires_count: 2},
];

describe('SessionLibraryPageComponent', () => {
  async function rendre(sessions = SESSIONS) {
    const open = vi.fn(() => ({afterClosed: () => of(true)}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolFightSessionService, useValue: {fightSessions: () => of(sessions)}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
        {provide: MatDialog, useValue: {open}},
      ],
    });
    const fixture = TestBed.createComponent(SessionLibraryPageComponent);
    await fixture.whenStable();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const page = fixture.nativeElement as HTMLElement;
    const ligne = (titre: string) => [...page.querySelectorAll('.cl-row')].find((row) => row.textContent?.includes(titre))!;
    const reprendre = (titre: string) => [...ligne(titre).querySelectorAll('button')].find((b) => b.textContent?.includes('Reprendre'))!;
    return {page, ligne, reprendre, navigate, fixture, open};
  }

  it('se présente comme « Mes parties », sans parler de clôture', async () => {
    const {page} = await rendre();

    expect(page.textContent).toContain('Mes parties');
    expect(page.textContent).not.toContain('Close');
  });

  it('« Reprendre » mène à la table, sans rien rouvrir ni demander', async () => {
    const {reprendre, navigate, open} = await rendre();

    reprendre('La semaine dernière').click();

    expect(open).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/session', 'close', 'play']);
  });
});
