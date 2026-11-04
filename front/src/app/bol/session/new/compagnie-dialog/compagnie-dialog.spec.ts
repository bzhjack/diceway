import {signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {provideRouter} from '@angular/router';
import {of, throwError} from 'rxjs';
import {BolCompagnieModel} from '../../../models/bol-compagnie.model';
import {BolCompagnieService} from '../../../services/bol-compagnie.service';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {CompagnieDialogComponent} from './compagnie-dialog';

const LAMES: BolCompagnieModel = {id: 'c1', nom: 'Les Lames', heros: [{id: 'h1', nom: 'Axel', avatar: null}], parties: 2};

describe('CompagnieDialogComponent', () => {
  const creer = vi.fn();
  const modifier = vi.fn();
  const fermer = vi.fn();
  const snack = vi.fn();
  const reset = vi.fn();
  const loadCatalog = vi.fn();
  let combatants: ReturnType<typeof signal<{catalogId: string; qty: number}[]>>;
  let fixture: ComponentFixture<CompagnieDialogComponent>;
  let element: HTMLElement;

  async function ouvrir(compagnie: BolCompagnieModel | null, heros = [{catalogId: 'hero:h1', qty: 1}]): Promise<void> {
    for (const espion of [creer, modifier, fermer, snack, reset, loadCatalog]) {
      espion.mockReset();
    }
    creer.mockReturnValue(of({...LAMES, id: 'c9'}));
    modifier.mockReturnValue(of(LAMES));
    combatants = signal(heros);
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: MAT_DIALOG_DATA, useValue: {compagnie}},
        {provide: MatDialogRef, useValue: {close: fermer}},
        {provide: MatDialog, useValue: {open: vi.fn()}},
        {provide: MatSnackBar, useValue: {open: snack}},
        {provide: BolCompagnieService, useValue: {creer, modifier}},
        {
          provide: CombatSelectionService,
          useValue: {
            loadCatalog,
            loading: signal(false),
            loadFailed: signal(false),
            combatants,
            entryFor: (id: string) => ({catalogId: id, kind: 'hero', sourceId: id.replace('hero:', ''), nom: id === 'hero:h2' ? 'Balaram' : 'Axel', avatar: ''}),
            remove: vi.fn(),
            reset,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(CompagnieDialogComponent);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function stable(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const bouton = (libelle: string) => [...element.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(libelle))!;
  const champ = () => element.querySelector<HTMLInputElement>('.otd-nom input')!;
  const texte = (selecteur: string) => element.querySelector(selecteur)?.textContent?.trim() ?? null;

  async function nommer(nom: string): Promise<void> {
    champ().value = nom;
    champ().dispatchEvent(new Event('input'));
    await stable();
  }

  it('ne demande qu’un nom et des héros', async () => {
    await ouvrir(null);

    expect(texte('.otd-surtitre')).toBe('Nouvelle compagnie');
    expect(champ().value).toBe('');
    expect(element.querySelectorAll('.otd-heros-pastille').length).toBe(1);
    expect(element.textContent).not.toContain('scénario');
  });

  it('attend un nom', async () => {
    await ouvrir(null);

    expect(bouton('Créer la compagnie').disabled).toBe(true);
    await nommer('   ');
    expect(bouton('Créer la compagnie').disabled).toBe(true);
    await nommer('Les Lames');
    expect(bouton('Créer la compagnie').disabled).toBe(false);
  });

  it('attend au moins un héros, et le dit', async () => {
    await ouvrir(null, []);
    await nommer('Les Lames');

    expect(bouton('Créer la compagnie').disabled).toBe(true);
    expect(element.textContent).toContain('« Créer la compagnie » attend au moins un héros.');
  });

  it('crée la compagnie avec son nom et ses héros, puis se ferme en la rendant', async () => {
    await ouvrir(null, [{catalogId: 'hero:h2', qty: 1}, {catalogId: 'hero:h1', qty: 1}]);
    await nommer('  Les Lames  ');

    bouton('Créer la compagnie').click();
    await stable();

    expect(creer).toHaveBeenCalledWith('Les Lames', ['h2', 'h1']);
    expect(reset).toHaveBeenCalled();
    expect(fermer).toHaveBeenCalledWith(expect.objectContaining({id: 'c9'}));
  });

  it('si la création échoue : le dit et reste ouvert', async () => {
    await ouvrir(null);
    creer.mockReturnValue(throwError(() => new Error('réseau')));
    await nommer('Les Lames');

    bouton('Créer la compagnie').click();
    await stable();

    expect(snack).toHaveBeenCalledTimes(1);
    expect(fermer).not.toHaveBeenCalled();
  });

  describe('une compagnie existante', () => {
    it('reprend son nom et ses héros, et dit que ça vaut pour ses prochaines parties', async () => {
      await ouvrir(LAMES, []);

      expect(champ().value).toBe('Les Lames');
      expect(combatants()).toEqual([{catalogId: 'hero:h1', qty: 1}]);
      expect(element.textContent).toContain('Ces changements valent pour ses prochaines parties');
    });

    it('enregistre, puis se ferme en la rendant', async () => {
      await ouvrir(LAMES, []);
      await nommer('Les Fils');

      bouton('Enregistrer').click();
      await stable();

      expect(modifier).toHaveBeenCalledWith('c1', 'Les Fils', ['h1']);
      expect(fermer).toHaveBeenCalledWith(LAMES);
    });

    it('fermé sans enregistrer, ne laisse pas ses héros dans la sélection', async () => {
      await ouvrir(LAMES, []);

      fixture.destroy();

      expect(reset).toHaveBeenCalled();
    });
  });
});
