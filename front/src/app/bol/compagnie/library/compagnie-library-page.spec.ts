import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter} from '@angular/router';
import {of, throwError} from 'rxjs';
import {BolCompagnieModel} from '../../models/bol-compagnie.model';
import {BolCompagnieService} from '../../services/bol-compagnie.service';
import {CompagnieDialogComponent} from '../../session/new/compagnie-dialog/compagnie-dialog';
import {CompagnieLibraryPageComponent} from './compagnie-library-page';

const LAMES: BolCompagnieModel = {id: 'c1', nom: 'Les Lames', heros: [{id: 'h1', nom: 'Axel', avatar: null}, {id: 'h2', nom: 'Grimar', avatar: null}], parties: 2};
const FILS: BolCompagnieModel = {id: 'c2', nom: 'Les Fils', heros: [{id: 'h3', nom: 'Balaram', avatar: null}], parties: 0};

describe('CompagnieLibraryPageComponent', () => {
  async function rendre(compagnies = [LAMES, FILS]) {
    const open = vi.fn(() => ({afterClosed: () => of(true)}));
    const supprimer = vi.fn(() => of(true));
    const liste = vi.fn(() => of(compagnies));
    const snack = vi.fn();
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolCompagnieService, useValue: {compagnies: liste, supprimer}},
        {provide: MatSnackBar, useValue: {open: snack}},
        {provide: MatDialog, useValue: {open}},
      ],
    });
    const fixture = TestBed.createComponent(CompagnieLibraryPageComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const ligne = (nom: string) => [...page.querySelectorAll('.cl-row')].find((row) => row.textContent?.includes(nom))!;
    return {page, ligne, open, supprimer, liste, snack, fixture};
  }

  it('liste les compagnies : leur nom, leurs héros et leurs parties', async () => {
    const {page, ligne} = await rendre();

    expect(page.textContent).toContain('Compagnies');
    expect(ligne('Les Lames').querySelector('.cl-row-meta')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Axel, Grimar · 2 parties');
    expect(ligne('Les Fils').querySelector('.cl-row-meta')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Balaram · aucune partie');
  });

  it('« Nouvelle compagnie » ouvre le dialogue, puis la liste se relit', async () => {
    const {page, open, liste, fixture} = await rendre();
    const lectures = liste.mock.calls.length;

    [...page.querySelectorAll('button')].find((b) => b.textContent?.includes('Nouvelle compagnie'))!.click();
    await fixture.whenStable();

    expect(open).toHaveBeenCalledWith(CompagnieDialogComponent, expect.objectContaining({data: {compagnie: null}}));
    expect(liste).toHaveBeenCalledTimes(lectures + 1);
  });

  it('« Modifier » ouvre le dialogue sur la compagnie', async () => {
    const {ligne, open} = await rendre();

    ligne('Les Lames').querySelector<HTMLButtonElement>('button[aria-label="Modifier Les Lames"]')!.click();

    expect(open).toHaveBeenCalledWith(CompagnieDialogComponent, expect.objectContaining({data: {compagnie: LAMES}}));
  });

  it('supprime après confirmation, puis la liste se relit', async () => {
    const {ligne, supprimer, liste, fixture} = await rendre();
    const lectures = liste.mock.calls.length;

    ligne('Les Fils').querySelector<HTMLButtonElement>('button[aria-label="Supprimer Les Fils"]')!.click();
    await fixture.whenStable();

    expect(supprimer).toHaveBeenCalledWith('c2');
    expect(liste).toHaveBeenCalledTimes(lectures + 1);
  });

  it('une compagnie qui a des parties ne se supprime pas : le bouton le dit', async () => {
    const {ligne, open} = await rendre();
    const bouton = ligne('Les Lames').querySelector<HTMLButtonElement>('button[aria-label="Supprimer Les Lames"]')!;

    expect(bouton.disabled).toBe(true);
    bouton.click();
    expect(open).not.toHaveBeenCalled();
  });

  it('si la suppression échoue : le dit', async () => {
    const {ligne, supprimer, snack, fixture} = await rendre();
    supprimer.mockReturnValue(throwError(() => new Error('réseau')));

    ligne('Les Fils').querySelector<HTMLButtonElement>('button[aria-label="Supprimer Les Fils"]')!.click();
    await fixture.whenStable();

    expect(snack).toHaveBeenCalledTimes(1);
  });
});
