import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter, Router} from '@angular/router';
import {of} from 'rxjs';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolFightSessionSummaryModel} from '../../models/bol-fight-session.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {chapitre} from '../chapitre.testing';
import {BolFightSessionService} from '../../services/bol-fight-session.service';
import {SessionLibraryPageComponent} from './session-library-page';

const SESSIONS: BolFightSessionSummaryModel[] = [
  {id: 'ouverte', titre: 'Ce soir', statut: 'libre', heros_count: 3, adversaires_count: 0},
  {id: 'close', titre: 'La semaine dernière', statut: 'libre', heros_count: 3, adversaires_count: 2},
];

/** Ce que l'accueil dit des deux parties : « Ce soir » sur le chapitre 1 de Perle du Beshaar, « La semaine dernière » improvisée. */
const ACCUEIL: BolAccueilModel = {
  derniere: 'ouverte',
  compagnies: [{id: 'c1', nom: 'Ce soir', heros: [], parties: 1}],
  parties: [
    {
      id: 'ouverte',
      compagnie_id: 'c1',
      titre: 'Ce soir',
      statut: 'libre',
      jouee_le: '2026-11-04T10:00:00+00:00',
      scenario_id: 'p1',
      scene_id: null,
      scenes: [],
      scenes_jouees: [],
      chapitres_joues: [],
      scenario_termine: false,
      figurants: 0,
      heros: [],
    },
    {
      id: 'close',
      compagnie_id: null,
      titre: 'La semaine dernière',
      statut: 'libre',
      jouee_le: '2026-11-01T10:00:00+00:00',
      scenario_id: null,
      scene_id: null,
      scenes: [],
      scenes_jouees: [],
      chapitres_joues: [],
      scenario_termine: false,
      figurants: 0,
      heros: [],
    },
  ],
  scenarios: [chapitre('p1', 'Perle du Beshaar — 1. Sacrilège à Satarla'), chapitre('p2', "Perle du Beshaar — 2. De sable et d'eau")],
  comptes: {heros: 0, pnjs: 0, creatures: 0, demons: 0, armes: 0, armures: 0, sessions: 2, compagnies: 1, scenarios: 1},
};

describe('SessionLibraryPageComponent', () => {
  async function rendre(sessions = SESSIONS) {
    const open = vi.fn(() => ({afterClosed: () => of(true)}));
    const changerChapitre = vi.fn(() => of({}));
    const accueil = vi.fn(() => of(ACCUEIL));
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolFightSessionService, useValue: {fightSessions: () => of(sessions), changerChapitre}},
        {provide: BolAccueilService, useValue: {accueil}},
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
    return {page, ligne, reprendre, navigate, fixture, open, changerChapitre, accueil};
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

  it('chaque ligne dit le scénario de la partie et son chapitre', async () => {
    const {ligne} = await rendre();

    expect(ligne('Ce soir').querySelector('.cl-row-scenario')?.textContent?.trim().replace(/\s+/g, ' ')).toBe('Perle du Beshaar · 1. Sacrilège à Satarla');
    expect(ligne('La semaine dernière').querySelector('.cl-row-scenario')?.textContent?.trim()).toBe('Partie improvisée');
  });

  it('« Changer de chapitre » passe la partie sur un autre chapitre de son scénario, puis la liste se relit', async () => {
    const {ligne, fixture, changerChapitre, accueil} = await rendre();

    ligne('Ce soir').querySelector<HTMLButtonElement>('.pch-bouton')!.click();
    await fixture.whenStable();
    [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')].find((b) => b.textContent?.includes("2. De sable et d'eau"))!.click();
    await fixture.whenStable();

    expect(changerChapitre).toHaveBeenCalledWith('ouverte', 'p2');
    expect(accueil).toHaveBeenCalledTimes(2);
  });

  it('une partie improvisée propose « Choisir un scénario »', async () => {
    const {ligne} = await rendre();

    expect(ligne('La semaine dernière').querySelector('.pch-bouton')?.textContent).toContain('Choisir un scénario');
  });
});
