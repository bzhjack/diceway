import {signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {CombatSelectionService} from '../../../services/combat-selection.service';
import {ActeStatut, PisteAffichee} from '../../models/theatre.model';
import {ScenePreviewComponent} from './scene-preview';

const GARDIENS = {
  id: 's5',
  titre: 'Les gardiens s’éveillent',
  lieu: 'Sanctuaire de Shazzadion',
  moment: 'nuit',
  meteo: null,
  danger: 3,
  image: '/assets/bol/decor.webp',
  distribution: [
    {kind: 'creature', source_id: 't', qty: 3, camp: 'adversaires'},
    {kind: 'creature', source_id: 'h', qty: 2, camp: 'adversaires'},
  ],
  pistes: [],
} as unknown as BolSceneModel;

const CATALOGUE = [
  {kind: 'creature', sourceId: 't', nom: 'Tentacule de la mosaïque'},
  {kind: 'creature', sourceId: 'h', nom: 'Hippocampe géant'},
] as unknown as CombatCatalogEntry[];

describe('ScenePreviewComponent', () => {
  async function rendre(scene: BolSceneModel, statut: ActeStatut, suites: PisteAffichee[] = []) {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [{provide: CombatSelectionService, useValue: {catalog: signal(CATALOGUE)}}],
    });
    const fixture = TestBed.createComponent(ScenePreviewComponent);
    fixture.componentRef.setInput('scene', scene);
    fixture.componentRef.setInput('statut', statut);
    fixture.componentRef.setInput('regionNom', 'Satarla');
    fixture.componentRef.setInput('numero', 5);
    fixture.componentRef.setInput('total', 10);
    fixture.componentRef.setInput('suites', suites);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    /** Chaque ligne : son libellé, puis sa valeur (ses éléments séparés par « | »). */
    const valeur = (el: Element | null) => (el?.children.length ? [...el.children].map((c) => texte(c)).join(' | ') : texte(el));
    const lignes = () => [...element.querySelectorAll('.spv-ligne')].map((l) => [texte(l.querySelector('.spv-libelle')), valeur(l.querySelector('.spv-valeur'))]);
    return {element, texte, lignes};
  }

  it('n’a plus d’image ; en tête, le numéro, le titre, le statut et la place dans le chapitre', async () => {
    const {element, texte} = await rendre(GARDIENS, 'jouee');

    expect(element.querySelector('img')).toBeNull();
    expect(texte(element.querySelector('.spv-numero'))).toBe('5');
    expect(element.querySelector('.spv-numero')!.classList).toContain('spv-numero--jouee');
    expect(texte(element.querySelector('.spv-titre'))).toBe('Les gardiens s’éveillent');
    expect(texte(element.querySelector('.spv-statut'))).toBe('check Déjà jouée · scène 5 sur 10');
  });

  it('une ligne par information : le lieu, l’ambiance, le danger, ceux d’en face nommés, la suite', async () => {
    const suite = {scene: {id: 's6', titre: 'Fuite et embarquement'} as BolSceneModel, numero: 6, statut: 'a-venir' as const};
    const {element, lignes} = await rendre(GARDIENS, 'jouee', [
      {texte: 'Fuir vers le quai du Pendu', scene_id: 's6', acte: suite},
      {texte: 'Interroger le prêtre', scene_id: null, acte: null},
    ]);

    expect(lignes()).toEqual([
      ['Lieu', 'Sanctuaire de Shazzadion, Satarla'],
      ['Ambiance', 'Nuit'],
      ['Danger', expect.any(String)],
      ['En face', '5 adversaires | Tentacule de la mosaïque ×3 | Hippocampe géant ×2'],
      ['Ensuite', '6 · Fuite et embarquement | Interroger le prêtre'],
    ]);
    expect(element.querySelector('.spv-cranes')!.getAttribute('aria-label')).toBe('3 sur 4');
    expect(element.querySelectorAll('.spv-cranes .spv-crane--on')).toHaveLength(3);
  });

  it('tait ce que la scène n’a pas (la région seule fait le lieu) ; sans distribution, le dit', async () => {
    const vide = {...GARDIENS, lieu: null, moment: null, danger: null, distribution: []} as unknown as BolSceneModel;
    const {lignes, element} = await rendre(vide, 'a-venir');

    expect(lignes()).toEqual([
      ['Lieu', 'Satarla'],
      ['En scène', 'Personne dans la distribution'],
    ]);
    expect(element.querySelector('.spv-statut')!.textContent).toContain('À venir');
  });
});
