import {TestBed} from '@angular/core/testing';
import {BolSceneJet} from '../../../models/bol-scene.model';
import {JetLance} from '../../models/theatre.model';
import {TapisCard} from '../../models/tapis.model';
import {SceneJetsComponent} from './scene-jets';

function jet(partiel: Partial<BolSceneJet> & Pick<BolSceneJet, 'titre'>): BolSceneJet {
  return {attributs: [], difficulte: 'moyenne', enjeu: null, echec: null, reussite: null, carriere: null, quand: null, ...partiel};
}

function heros(nom: string, pivotId: number): TapisCard {
  return {
    key: `hero-${pivotId}`,
    kind: 'hero',
    camp: 'heros',
    pivotId,
    sourceId: `h${pivotId}`,
    nom,
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '1',
    vitaliteCourante: 10,
    vitaliteMax: 10,
    joueur: null,
    heroisme: 3,
    attitude: null,
    vilenie: null,
  };
}

const COQUILLAGE = jet({titre: 'Coquillage', attributs: ['vigueur'], difficulte: 'ardue', enjeu: 'dégager sa jambe', echec: 'le pied reste pris'});
const TENTACULES = jet({titre: 'Tentacules', attributs: ['vigueur', 'agilite']});
const POISSONS = jet({titre: 'Poissons volants', echec: 'd3 dégâts, puis à chaque round les pieds dans l’eau'});
const GRIMAR = heros('Grimar', 1);
const AXEL = heros('Axel', 2);

describe('SceneJetsComponent', () => {
  async function rendre(jets: readonly BolSceneJet[], lesHeros: readonly TapisCard[]) {
    const fixture = TestBed.createComponent(SceneJetsComponent);
    fixture.componentRef.setInput('jets', jets);
    fixture.componentRef.setInput('heros', lesHeros);
    const lances: JetLance[] = [];
    fixture.componentInstance.lancer.subscribe((l) => lances.push(l));
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const texte = (e: Element | null | undefined) => e?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const ligne = (titre: string) => [...el.querySelectorAll('.scj-jet')].find((li) => texte(li.querySelector('.scj-titre')) === titre)!;
    return {fixture, el, texte, ligne, lances};
  }

  it('montre chaque jet : ses attributs et sa difficulté en badges, puis l’enjeu et l’échec', async () => {
    const {ligne, texte} = await rendre([COQUILLAGE, TENTACULES], [GRIMAR]);

    expect([...ligne('Coquillage').querySelectorAll('.scj-badge')].map((b) => texte(b))).toEqual(['Vigueur', 'Ardue −1']);
    expect([...ligne('Tentacules').querySelectorAll('.scj-badge')].map((b) => texte(b))).toEqual(['Vigueur ou Agilité', 'Moyenne']);
    expect(texte(ligne('Coquillage').querySelector('.scj-detail'))).toBe('dégager sa jambe · échec : le pied reste pris');
  });

  it('un effet sans attribut dit « Sans jet » et ne se lance pas', async () => {
    const {ligne, texte} = await rendre([POISSONS], [GRIMAR]);

    expect(texte(ligne('Poissons volants').querySelector('.scj-badge'))).toBe('Sans jet');
    expect(ligne('Poissons volants').querySelector('.scj-lancer')).toBeNull();
    expect(texte(ligne('Poissons volants').querySelector('.scj-detail'))).toBe('d3 dégâts, puis à chaque round les pieds dans l’eau');
  });

  it('sans héros à la table, pas de « Lancer pour »', async () => {
    const {ligne} = await rendre([COQUILLAGE], []);

    expect(ligne('Coquillage').querySelector('.scj-lancer')).toBeNull();
  });

  it('« Lancer pour » propose les héros, et choisir l’un rend le jet et le héros', async () => {
    const {fixture, ligne, lances} = await rendre([COQUILLAGE], [GRIMAR, AXEL]);

    expect(ligne('Coquillage').querySelector('.scj-lancer')?.getAttribute('aria-label')).toBe('Lancer « Coquillage » pour un héros');
    ligne('Coquillage').querySelector<HTMLButtonElement>('.scj-lancer')!.click();
    await fixture.whenStable();
    const items = [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Grimar', 'Axel']);
    items[0].click();

    expect(lances).toEqual([{jet: COQUILLAGE, hero: GRIMAR}]);
  });
});
