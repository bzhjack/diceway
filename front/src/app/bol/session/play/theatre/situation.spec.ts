import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {of, Subject} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
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
    melee: 1,
    tir: 0,
    initiative: 0,
    ...partiel,
  };
}

const GRIMAR = carte({key: 'hero-1', kind: 'hero', nom: 'Grimar', camp: 'heros', rang: null, vitaliteCourante: 8, vitaliteMax: 11, joueur: 'Clara', heroisme: 2});
const CHEMDI = carte({key: 'pnj-3', kind: 'pnj', nom: 'Chemdi', pivotId: 3, attitude: 'hostile', melee: 2, tir: -1, vitaliteCourante: 8, vitaliteMax: 8});
const SOLDAT = carte({key: 'pnj-4', kind: 'pnj', nom: 'Soldat du guet #2', pivotId: 4, attitude: 'mefiant', vitaliteCourante: 4, vitaliteMax: 6});
const LOUP = carte({key: 'creature-5', kind: 'creature', nom: 'Loup', pivotId: 5, camp: 'heros', rang: 'Piétaille', tir: null, initiative: null});

describe('SituationComponent', () => {
  const enCours = new Subject<unknown>();
  const applyDamage = vi.fn(() => enCours);
  const setAttitude = vi.fn(() => of({id: 'sess'}));
  const adjustHeroisme = vi.fn(() => enCours);

  async function rendre(cards: TapisCard[]) {
    applyDamage.mockClear();
    setAttitude.mockClear();
    adjustHeroisme.mockClear();
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        {provide: BolFightSessionService, useValue: {applyDamage, setAttitude}},
        {provide: BolHerosService, useValue: {adjustHeroisme}},
      ],
    });
    const fixture = TestBed.createComponent(SituationComponent);
    fixture.componentRef.setInput('cards', cards);
    fixture.componentRef.setInput('sessionId', 'sess');
    const ouvertes: TapisCard[] = [];
    const camps: TapisCard[] = [];
    const changements: TableChange[] = [];
    fixture.componentInstance.cardToggled.subscribe((c) => ouvertes.push(c));
    fixture.componentInstance.campToggleRequested.subscribe((c) => camps.push(c));
    fixture.componentInstance.changed.subscribe((c) => changements.push(c));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const bouton = (label: string): HTMLButtonElement => element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
    const stable = async () => {
      await fixture.whenStable();
    };
    return {element, texte, bouton, stable, ouvertes, camps, changements};
  }

  it('range ceux d’en face puis la compagnie, chaque section avec son nombre et sa vitalité totale', async () => {
    const {element, texte} = await rendre([GRIMAR, SOLDAT, CHEMDI, LOUP]);

    expect([...element.querySelectorAll('.sit-section')].map((s) => texte(s))).toEqual([
      'En face · 2 12/14 PV',
      'La compagnie · 1 héros et 1 allié 14/17 PV',
    ]);
    const groupes = [...element.querySelectorAll('tbody.sit-groupe')];
    expect(groupes.map((g) => g.getAttribute('data-drop-camp'))).toEqual(['adversaires', 'heros']);
    expect([...groupes[0].querySelectorAll('.sit-nom')].map((n) => texte(n))).toEqual(['Chemdi', 'Soldat du guet #2']);
    expect([...groupes[1].querySelectorAll('.sit-nom')].map((n) => texte(n))).toEqual(['Grimar Clara', 'Loup']);
  });

  it('montre sur chaque ligne de quoi juger la menace : attitude, vitalité, mêlée, tir, défense, initiative, dégâts', async () => {
    const {element, texte} = await rendre([CHEMDI, LOUP]);

    const chemdi = element.querySelectorAll('tbody.sit-groupe')[0].querySelector('.sit-ligne')!;
    expect(texte(chemdi.querySelector('.sit-attitude'))).toBe('Hostilearrow_drop_down');
    expect(texte(chemdi.querySelector('.sit-vie-valeur'))).toBe('8/8');
    expect([...chemdi.querySelectorAll('.sit-num')].map((td) => texte(td))).toEqual(['2', '−1', '1', '0', 'd6']);
    const loup = element.querySelectorAll('tbody.sit-groupe')[1].querySelector('.sit-ligne')!;
    expect(texte(loup.querySelector('.sit-allie'))).toBe('Allié');
    expect([...loup.querySelectorAll('.sit-num')].slice(1, 4).map((td) => texte(td))).toEqual(['—', '1', '—']);
  });

  it('règle la vitalité d’un PNJ pas à pas, par son type et sa ligne', async () => {
    const {bouton} = await rendre([CHEMDI]);

    bouton('Retirer 1 point de vitalité à Chemdi').click();

    expect(applyDamage).toHaveBeenCalledWith('sess', 'pnj', 3, -1);
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

  it('le menu « ⋯ » ouvre la carte, ou fait changer de camp', async () => {
    const {bouton, stable, ouvertes, camps} = await rendre([CHEMDI]);
    const choisir = async (entree: string) => {
      bouton('Plus d’actions sur Chemdi').click();
      await stable();
      [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')].find((b) => b.textContent?.includes(entree))!.click();
      await stable();
    };

    await choisir('Ouvrir sa carte');
    await choisir('Passer du côté des héros');

    expect(ouvertes).toEqual([CHEMDI]);
    expect(camps).toEqual([CHEMDI]);
  });

  it('pendant un enregistrement, ignore un second pas sans faire pâlir le bouton', async () => {
    const {bouton} = await rendre([GRIMAR]);
    const moins = bouton('Retirer 1 point de vitalité à Grimar');

    moins.click();
    TestBed.tick();
    expect(applyDamage).toHaveBeenCalledTimes(1);
    expect(moins.getAttribute('aria-disabled')).toBeNull();
    moins.click();

    expect(applyDamage).toHaveBeenCalledTimes(1);
  });

  it('un pas d’héroïsme en cours laisse la vitalité libre', async () => {
    const {bouton} = await rendre([GRIMAR]);

    bouton('Ajouter 1 point d’héroïsme à Grimar').click();
    TestBed.tick();
    bouton('Retirer 1 point de vitalité à Grimar').click();

    expect(adjustHeroisme).toHaveBeenCalledWith('s1', 1);
    expect(applyDamage).toHaveBeenCalledTimes(1);
  });

  it('ignore un pas au-delà du maximum de vitalité, sans désactiver le bouton', async () => {
    const {bouton} = await rendre([carte({...GRIMAR, vitaliteCourante: 11})]);
    const plus = bouton('Rendre 1 point de vitalité à Grimar');

    expect(plus.getAttribute('aria-disabled')).toBe('true');
    plus.click();

    expect(applyDamage).not.toHaveBeenCalled();
  });

  it('le dé d’un héros ouvre sa carte, où se trouve son jet d’action', async () => {
    const {bouton, ouvertes} = await rendre([GRIMAR]);

    bouton('Jet d’action de Grimar').click();

    expect(ouvertes).toEqual([GRIMAR]);
  });
});
