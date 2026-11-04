import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {of} from 'rxjs';
import {BolFightSessionSummaryModel} from '../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {DwConfirmDialogData} from '../../../shared/models/dw-confirm-dialog.model';
import {SessionLibraryPageComponent} from './session-library-page';

const SESSIONS: BolFightSessionSummaryModel[] = [
  {id: 'ouverte', titre: 'Ce soir', statut: 'libre', heros_count: 3, adversaires_count: 0},
  {id: 'close', titre: 'La semaine dernière', statut: 'terminee', heros_count: 3, adversaires_count: 2},
  {id: 'autre', titre: 'Les Fils du Serpent', statut: 'terminee', heros_count: 2, adversaires_count: 0},
];

describe('SessionLibraryPageComponent', () => {
  async function rendre(sessions = SESSIONS, confirme = true) {
    const reopen = vi.fn(() => of({}));
    const open = vi.fn((_component: unknown, _config: {data: DwConfirmDialogData}) => ({afterClosed: () => of(confirme)}));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolFightSessionService, useValue: {fightSessions: () => of(sessions), reopen}},
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
    return {page, ligne, reprendre, reopen, navigate, fixture, open};
  }

  it('montre les tables closes avec les autres, en le disant', async () => {
    const {ligne} = await rendre();

    expect(ligne('La semaine dernière').textContent).toContain('Close');
    expect(ligne('Ce soir').textContent).not.toContain('Close');
  });

  it('sans autre table ouverte, rouvre une table close avant d’y retourner, sans rien demander', async () => {
    const {reprendre, reopen, navigate, open} = await rendre([SESSIONS[1], SESSIONS[2]]);

    reprendre('La semaine dernière').click();

    expect(open).not.toHaveBeenCalled();
    expect(reopen).toHaveBeenCalledWith('close');
    expect(navigate).toHaveBeenCalledWith(['/session', 'close', 'play']);
  });

  it('retourne à la table ouverte sans la toucher', async () => {
    const {reprendre, reopen, navigate, open} = await rendre();

    reprendre('Ce soir').click();

    expect(open).not.toHaveBeenCalled();
    expect(reopen).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/session', 'ouverte', 'play']);
  });

  describe('avec une autre table ouverte', () => {
    it('demande confirmation, puis rouvre la table (le serveur clôt l’autre) avant d’y retourner', async () => {
      const {reprendre, reopen, navigate, open} = await rendre();

      reprendre('La semaine dernière').click();

      expect(open).toHaveBeenCalledTimes(1);
      const data = open.mock.calls[0][1].data;
      expect(data.title).toBe('Reprendre La semaine dernière');
      expect(data.message).toBe('Une seule table est ouverte à la fois : « Ce soir » se clôt. Elle reste ici, d’où elle se reprend.');
      expect(reopen).toHaveBeenCalledWith('close');
      expect(navigate).toHaveBeenCalledWith(['/session', 'close', 'play']);
    });

    it('dit que le combat de l’autre table s’arrête', async () => {
      const {reprendre, open} = await rendre([{...SESSIONS[0], statut: 'combat'}, SESSIONS[1]]);

      reprendre('La semaine dernière').click();

      expect(open.mock.calls[0][1].data.message).toContain('« Ce soir » se clôt, son combat en cours s’arrête.');
    });

    it('sans confirmation, ne rouvre rien', async () => {
      const {reprendre, reopen, navigate} = await rendre(SESSIONS, false);

      reprendre('La semaine dernière').click();

      expect(reopen).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
    });

    it('deux tables encore ouvertes (d’avant la règle) : reprendre l’une rouvre celle-ci et clôt l’autre', async () => {
      const {reprendre, reopen, navigate, open} = await rendre([SESSIONS[0], {...SESSIONS[2], statut: 'libre'}]);

      reprendre('Ce soir').click();

      expect(open.mock.calls[0][1].data.message).toContain('« Les Fils du Serpent » se clôt');
      expect(reopen).toHaveBeenCalledWith('ouverte');
      expect(navigate).toHaveBeenCalledWith(['/session', 'ouverte', 'play']);
    });
  });
});
