import {provideHttpClient} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {of} from 'rxjs';
import {BolSceneChanges, BolSceneModel} from '../../../../models/bol-scene.model';
import {BolCatalogService} from '../../../../services/bol-catalog.service';
import {BolSceneService} from '../../../../services/bol-scene.service';
import {openSceneEditor} from './scene-editor-dialog';

const SCENE = {
  id: 'sc1',
  titre: 'Le gué',
  region_id: null,
  lieu: null,
  moment: null,
  meteo: null,
  danger: 2,
  image: null,
  lecture: null,
  jeu: null,
  notes: null,
  pistes: [{texte: 'Vers la tour', scene_id: null}],
} as unknown as BolSceneModel;

describe('openSceneEditor', () => {
  let saved: BolSceneChanges[];
  let closed: (BolSceneModel | undefined)[];

  const overlay = () => document.querySelector<HTMLElement>('.cdk-overlay-container')!;
  const champ = (id: string) => overlay().querySelector<HTMLInputElement>('#' + id)!;
  const bouton = (texte: string) =>
    [...overlay().querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.includes(texte))!;
  const stable = () => TestBed.inject(MatDialog).openDialogs[0] ? new Promise((done) => setTimeout(done)) : Promise.resolve();
  const saisir = async (id: string, valeur: string) => {
    const input = champ(id);
    input.value = valeur;
    input.dispatchEvent(new Event('input'));
    await stable();
  };

  beforeEach(async () => {
    saved = [];
    closed = [];
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        {provide: BolCatalogService, useValue: {regions: () => of([])}},
        {
          provide: BolSceneService,
          useValue: {
            update: (_id: string, changes: BolSceneChanges) => {
              saved.push(changes);
              return of(SCENE);
            },
          },
        },
      ],
    });
    openSceneEditor(TestBed.inject(MatDialog), {scene: SCENE, siblings: []}).subscribe((scene) => closed.push(scene));
    await stable();
  });

  afterEach(() => TestBed.inject(MatDialog).closeAll());

  it('part de la scène', () => {
    expect(champ('sed-titre').value).toBe('Le gué');
    expect(overlay().querySelectorAll('.sed-piste')).toHaveLength(1);
  });

  it('refuse un titre vide et une illustration qui n’est pas une adresse', async () => {
    const enregistrer = bouton('Enregistrer');
    expect(enregistrer.disabled).toBe(false);

    await saisir('sed-titre', '');
    expect(enregistrer.disabled).toBe(true);

    await saisir('sed-titre', 'Le gué');
    await saisir('sed-image', 'n’importe quoi');
    expect(enregistrer.disabled).toBe(true);

    await saisir('sed-image', 'https://exemple.fr/gue.webp');
    expect(enregistrer.disabled).toBe(false);
  });

  it('ajoute et retire des pistes', async () => {
    bouton('Ajouter une piste').click();
    await stable();
    expect(overlay().querySelectorAll('.sed-piste')).toHaveLength(2);

    overlay().querySelector<HTMLButtonElement>('[aria-label="Retirer la piste 1"]')!.click();
    await stable();
    expect(overlay().querySelectorAll('.sed-piste')).toHaveLength(1);
    expect(overlay().querySelector<HTMLInputElement>('.sed-piste input')!.value).toBe('');
  });

  it('enregistre ce qui a été saisi, et se ferme avec la scène', async () => {
    await saisir('sed-titre', ' Le pont ');
    await saisir('sed-lecture', 'Le vent se lève.');

    overlay().querySelector<HTMLFormElement>('form')!.requestSubmit();
    await stable();

    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({titre: 'Le pont', lecture: 'Le vent se lève.', danger: 2, pistes: [{texte: 'Vers la tour', scene_id: null}]});
    await new Promise((done) => setTimeout(done, 50));
    expect(closed).toEqual([SCENE]);
  });
});
