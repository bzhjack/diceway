import {TestBed} from '@angular/core/testing';
import {MatTooltip} from '@angular/material/tooltip';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {of} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {TableChange} from '../../models/table-change.model';
import {TapisCard} from '../../models/tapis.model';
import {SituationComponent} from './situation';

function carte(partiel: Partial<TapisCard> & Pick<TapisCard, 'key' | 'kind' | 'nom'>): TapisCard {
  return {
    camp: 'adversaires',
    pivotId: 1,
    sourceId: 's1',
    avatar: '',
    badge: null,
    rang: 'Coriace',
    degats: 'd6',
    defense: '1',
    vitaliteCourante: 6,
    vitaliteMax: 6,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
    ...partiel,
  };
}

const GRIMAR = carte({key: 'hero-1', kind: 'hero', nom: 'Grimar', camp: 'heros', rang: null, vitaliteCourante: 8, vitaliteMax: 11, joueur: 'Clara', heroisme: 2});
const CHEMDI = carte({key: 'pnj-3', kind: 'pnj', nom: 'Chemdi', pivotId: 3, sourceId: 's3', attitude: 'hostile', vitaliteCourante: 8, vitaliteMax: 8});
const SOLDAT = carte({key: 'pnj-4', kind: 'pnj', nom: 'Soldat du guet #2', pivotId: 4, sourceId: 's4', attitude: 'mefiant', vitaliteCourante: 4, vitaliteMax: 6});
const LOUP = carte({key: 'creature-5', kind: 'creature', nom: 'Loup', pivotId: 5, sourceId: 's5', camp: 'heros', rang: 'Piétaille'});

describe('SituationComponent', () => {
  const setAttitude = vi.fn(() => of({id: 'sess'}));

  async function rendre(cards: TapisCard[]) {
    setAttitude.mockClear();
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        {provide: BolFightSessionService, useValue: {setAttitude}},
      ],
    });
    const fixture = TestBed.createComponent(SituationComponent);
    fixture.componentRef.setInput('cards', cards);
    fixture.componentRef.setInput('sessionId', 'sess');
    const ouvertes: TapisCard[] = [];
    const selectionnees: TapisCard[] = [];
    const changements: TableChange[] = [];
    fixture.componentInstance.cardToggled.subscribe((c) => ouvertes.push(c));
    fixture.componentInstance.selectToggled.subscribe((c) => selectionnees.push(c));
    fixture.componentInstance.changed.subscribe((c) => changements.push(c));
    const ajouts: unknown[] = [];
    fixture.componentInstance.ajouterDemande.subscribe(() => ajouts.push(true));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const bouton = (label: string): HTMLButtonElement => element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
    const stable = async () => {
      await fixture.whenStable();
    };
    /** Le texte de l'infobulle d'un élément. */
    const bulle = (el: Element): string => fixture.debugElement.query((d) => d.nativeElement === el).injector.get(MatTooltip).message;
    return {element, texte, bouton, bulle, stable, ouvertes, selectionnees, changements, ajouts};
  }

  it('range ceux d’en face puis la compagnie en cartes, chaque camp avec son nombre, sa vitalité totale et ses attitudes', async () => {
    const {element, texte} = await rendre([GRIMAR, SOLDAT, CHEMDI, LOUP]);

    expect([...element.querySelectorAll('.sit-camp-detail')].map((s) => texte(s))).toEqual([
      '2 · 12/14 PV · 1 hostile, 1 méfiant',
      '1 héros · 14/17 PV · 1 allié',
    ]);
    const camps = [...element.querySelectorAll('section.sit-camp')];
    expect(camps.map((g) => g.getAttribute('data-drop-camp'))).toEqual(['adversaires', 'heros']);
    expect([...camps[0].querySelectorAll('.dw-tuile__nom')].map((n) => texte(n))).toEqual(['Chemdi', 'Soldat du guet #2']);
    expect([...camps[1].querySelectorAll('.dw-tuile__nom')].map((n) => texte(n))).toEqual(['Grimar', 'Loup']);
  });

  it('« Ajouter », dans l’en-tête de ceux d’en face, demande les coulisses ; sans allié, la compagnie dit qu’on peut en glisser un', async () => {
    const {element, texte, ajouts} = await rendre([GRIMAR, CHEMDI]);

    element.querySelector<HTMLButtonElement>('.sit-camp--face .sit-ajouter')!.click();

    expect(ajouts).toHaveLength(1);
    expect(texte(element.querySelector('.sit-astuce'))).toBe("Glissez une tuile d'en face ici : elle devient alliée.");
  });

  it('les exemplaires d’une même fiche n’ont qu’une tuile et un cœur vide, qui ouvre le détail de chacun ; l’attitude vaut pour tous', async () => {
    const garde1 = carte({key: 'pnj-7', kind: 'pnj', nom: 'Garde #1', pivotId: 7, sourceId: 'g', attitude: 'mefiant'});
    const garde2 = carte({key: 'pnj-8', kind: 'pnj', nom: 'Garde #2', pivotId: 8, sourceId: 'g', attitude: 'mefiant', vitaliteCourante: 4});
    const {element, texte, bouton, bulle, stable, ouvertes} = await rendre([garde1, garde2]);

    const cartes = [...element.querySelectorAll('.sit-camp--face bol-tuile')];
    expect(cartes).toHaveLength(1);
    expect(texte(cartes[0].querySelector('.dw-tuile__tete'))).toBe('Garde, 2 exemplaires');
    expect(texte(cartes[0].querySelector('.dw-tuile-marque'))).toBe('×2');
    expect(cartes[0].querySelectorAll('.dw-tuile__vies .sit-coeur--groupe')).toHaveLength(1);
    expect(cartes[0].querySelector('.dw-tuile__vies b')).toBeNull();
    bouton('Vitalité des 2 exemplaires de Garde').click();
    await stable();
    const lignes = [...document.querySelectorAll<HTMLButtonElement>('.sit-pop-ligne')];
    expect(lignes.map((l) => l.textContent?.replace(/\s+/g, ''))).toEqual(['#16/6', '#24/6']);
    expect(texte(document.querySelector('.sit-pop-total'))).toBe('10/12 PV');
    expect(texte(cartes[0].querySelector('.sit-attitude'))).toBe('');
    expect(bulle(cartes[0].querySelector('.sit-attitude')!)).toBe('Méfiants');

    lignes[1].click();
    await stable();
    expect(ouvertes).toEqual([garde2]);
    expect(document.querySelector('.sit-pop')).toBeNull();

    bouton('Attitude de Garde : Méfiant').click();
    await stable();
    [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')].find((b) => b.textContent?.includes('Hostile'))!.click();
    await stable();
    expect(setAttitude.mock.calls).toEqual([
      ['sess', 'pnj', 7, 'hostile'],
      ['sess', 'pnj', 8, 'hostile'],
    ]);
  });

  it('garde les tuiles légères : le rang, la sorte et l’attitude d’en face, la vitalité ; un héros a son jet, son héroïsme et son cœur au pied', async () => {
    const {element, texte, bulle} = await rendre([CHEMDI, GRIMAR, LOUP]);

    const chemdi = element.querySelector('.sit-camp--face bol-tuile')!;
    expect(texte(chemdi.querySelector('.dw-tuile-rang'))).toBe('Coriace');
    expect(chemdi.querySelector('.dw-tuile-sorte')!.getAttribute('aria-label')).toBe('PNJ');
    expect(bulle(chemdi.querySelector('.dw-tuile-sorte')!)).toBe('PNJ');
    expect(bulle(chemdi.querySelector('.sit-attitude')!)).toBe('Hostile');
    expect(chemdi.querySelector('.dw-tuile__pied')).toBeNull();
    expect(texte(chemdi.querySelector('.dw-tuile__coeur b'))).toBe('8');
    expect(chemdi.querySelector('.dw-tuile__coeur')!.getAttribute('aria-label')).toBe('Vitalité de Chemdi : 8/8');
    expect(chemdi.querySelector('.dw-tuile__ecusson')).toBeNull();
    expect(chemdi.querySelector('.sit-coeur--groupe')).toBeNull();
    expect(element.querySelector('[aria-label^="Plus d’actions"]')).toBeNull();
    const [grimar, loup] = [...element.querySelectorAll('.sit-camp--compagnie bol-tuile')];
    expect(texte(grimar.querySelector('.dw-tuile__sous'))).toBe('');
    expect(texte(grimar)).not.toContain('Clara');
    expect(grimar.querySelector('.dw-tuile__vies')).toBeNull();
    expect([...grimar.querySelectorAll('.dw-tuile__pied b')].map((b) => texte(b))).toEqual(['2', '8']);
    expect(grimar.querySelector('.dw-tuile__pied [aria-label="Jet d’action de Grimar"]')).not.toBeNull();
    expect(loup.querySelector('.dw-tuile__pied')).toBeNull();
    expect(loup.querySelector('.sit-attitude')).toBeNull();
    expect(loup.querySelector('.dw-tuile-sorte')!.getAttribute('aria-label')).toBe('Créature');
  });

  it('change l’attitude d’un menu, et la rend à la page', async () => {
    const {bouton, stable, changements} = await rendre([SOLDAT]);

    bouton('Attitude de Soldat du guet #2 : Méfiant').click();
    await stable();
    [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')].find((b) => b.textContent?.includes('Neutre'))!.click();
    await stable();

    expect(setAttitude).toHaveBeenCalledWith('sess', 'pnj', 4, 'neutre');
    expect(changements).toEqual([{session: {id: 'sess'}}]);
  });

  it('ne règle rien sur la carte : son portrait, qui la couvre, ouvre le détail du personnage ; Ctrl + clic sélectionne ses exemplaires', async () => {
    const garde1 = carte({key: 'pnj-7', kind: 'pnj', nom: 'Garde #1', pivotId: 7, sourceId: 'g'});
    const garde2 = carte({key: 'pnj-8', kind: 'pnj', nom: 'Garde #2', pivotId: 8, sourceId: 'g'});
    const {element, bouton, ouvertes, selectionnees} = await rendre([GRIMAR, garde1, garde2]);

    expect(element.querySelector('[aria-label^="Retirer 1 point"], [aria-label^="Rendre 1 point"], [aria-label^="Ajouter 1 point"]')).toBeNull();
    bouton('Ouvrir la carte de Grimar').click();
    bouton('Ouvrir la carte de Garde #1').dispatchEvent(new MouseEvent('click', {ctrlKey: true, bubbles: true}));

    expect(ouvertes).toEqual([GRIMAR]);
    expect(selectionnees).toEqual([garde1, garde2]);
  });

  it('le dé d’un héros ouvre sa carte, où se trouve son jet d’action', async () => {
    const {bouton, ouvertes} = await rendre([GRIMAR]);

    bouton('Jet d’action de Grimar').click();

    expect(ouvertes).toEqual([GRIMAR]);
  });
});
