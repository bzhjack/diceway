import {signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BolSceneJet, BolSceneModel} from '../../../models/bol-scene.model';
import {SceneLectureComponent} from './scene-lecture';
import {SceneStageStore} from './scene-stage.store';

function scene(id: string, notes: string, jeu: string | null = null, jets: BolSceneJet[] | null = null): BolSceneModel {
  return {
    id,
    scenario_id: null,
    titre: `Scène ${id}`,
    ordre: 0,
    notes,
    distribution: [],
    region_id: null,
    lieu: null,
    moment: null,
    meteo: null,
    danger: null,
    lecture: 'Il pleut.',
    jeu,
    jets,
    pistes: null,
    image: null,
  };
}

describe('SceneLectureComponent', () => {
  let fixture: ComponentFixture<SceneLectureComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{provide: SceneStageStore, useValue: {busy: signal(false)}}],
    });
    fixture = TestBed.createComponent(SceneLectureComponent);
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau est dans la sacoche.'));
    fixture.componentRef.setInput('acts', []);
    await fixture.whenStable();
  });

  const onglet = (host: HTMLElement, libelle: string): HTMLButtonElement =>
    [...host.querySelectorAll<HTMLButtonElement>('.lec-onglet')].find((b) => b.textContent?.includes(libelle))!;

  it('s’ouvre sur le texte à lire ; le secret du MJ a son onglet, en clair', async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.lec-texte')?.textContent).toBe('Il pleut.');
    expect(onglet(host, 'À lire').getAttribute('aria-pressed')).toBe('true');

    onglet(host, 'Secret du MJ').click();
    await fixture.whenStable();

    expect(onglet(host, 'Secret du MJ').getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.lec-secret')?.textContent).toBe('Le sceau est dans la sacoche.');
    expect(host.querySelector('.lec-texte')).toBeNull();
  });

  it("propose l’onglet « Mise en scène » seulement quand la scène en a une", async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(onglet(host, 'Mise en scène')).toBeUndefined();
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau est dans la sacoche.', 'Vigueur Ardu (-1) pour se dégager.'));
    await fixture.whenStable();

    expect(onglet(host, 'En jeu')).toBeUndefined();
    onglet(host, 'Mise en scène').click();
    await fixture.whenStable();

    expect(host.querySelector('.lec-jeu')?.textContent).toBe('Vigueur Ardu (-1) pour se dégager.');
  });

  it('range les onglets : à lire, jets, mise en scène, secret ; les jets n’ont leur onglet que s’il y en a', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const libelles = () => [...host.querySelectorAll('.lec-onglet')].map((b) => b.textContent?.replace('visibility_off', '').trim());
    expect(libelles()).toEqual(['À lire aux joueurs', 'Secret du MJ']);

    const coquillage: BolSceneJet = {titre: 'Coquillage', attributs: ['vigueur'], difficulte: 'ardue', enjeu: null, echec: null, reussite: null, carriere: null, quand: null};
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau.', 'Piocher 2 effets.', [coquillage]));
    await fixture.whenStable();
    expect(libelles()).toEqual(['À lire aux joueurs', 'Jets 1', 'Mise en scène', 'Secret du MJ']);

    onglet(host, 'Jets').click();
    await fixture.whenStable();
    expect(host.querySelector('bol-scene-jets .scj-titre')?.textContent?.trim()).toBe('Coquillage');
  });

  it('propose d’agrandir la lecture, et en grand ne garde qu’une croix pour la fermer', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const demandes: unknown[] = [];
    fixture.componentInstance.grandToggled.subscribe(() => demandes.push(true));

    expect(host.classList).not.toContain('lec--grand');
    // La scène se modifie depuis son aperçu, sur la frise : pas de crayon dans le carnet.
    expect(host.querySelector('button.lec-preparer')).toBeNull();
    host.querySelector<HTMLButtonElement>('button.lec-agrandir')!.click();
    expect(demandes).toHaveLength(1);

    fixture.componentRef.setInput('grand', true);
    await fixture.whenStable();
    expect(host.classList).toContain('lec--grand');
    expect(host.querySelector('button.lec-agrandir')).toBeNull();
    expect(host.querySelector('button.lec-preparer')).toBeNull();
    host.querySelector<HTMLButtonElement>('button.lec-fermer')!.click();
    expect(demandes).toHaveLength(2);
  });

  it('revient au texte à lire quand la scène change', async () => {
    const host = fixture.nativeElement as HTMLElement;
    onglet(host, 'Secret du MJ').click();
    await fixture.whenStable();
    expect(host.querySelector('.lec-texte')).toBeNull();

    fixture.componentRef.setInput('scene', scene('s2', 'Jesharek ment.'));
    await fixture.whenStable();

    expect(host.querySelector('.lec-texte')).not.toBeNull();
    expect(onglet(host, 'À lire').getAttribute('aria-pressed')).toBe('true');
  });

  it('sans piste, pas d’onglet « Pistes »', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(onglet(host, 'Pistes')).toBeUndefined();
    expect(host.querySelector('.lec-piste')).toBeNull();
  });

  it('montre les pistes dans leur onglet, avec leur nombre, chacune avec la scène où elle mène', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const avecPistes = {
      ...scene('s1', 'Le sceau est dans la sacoche.'),
      pistes: [
        {texte: 'Gagner le combat', scene_id: 's9'},
        {texte: 'Fuir par les toits', scene_id: null},
      ],
    };
    fixture.componentRef.setInput('scene', avecPistes);
    fixture.componentRef.setInput('acts', [{numero: 14, scene: {id: 's9', titre: 'La taverne du Puits sec'}, statut: 'a-venir'}]);
    await fixture.whenStable();

    const texte = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim();
    expect(host.querySelector('.lec-piste')).toBeNull();
    expect(texte(onglet(host, 'Pistes').querySelector('.lec-onglet-compte')!)).toBe('2');

    onglet(host, 'Pistes').click();
    await fixture.whenStable();

    expect(onglet(host, 'Pistes').getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.lec-texte')).toBeNull();
    const pistes = [...host.querySelectorAll('.lec-piste')];
    expect(pistes.map((p) => texte(p.querySelector('.lec-piste-texte b') ?? p))).toEqual(['14 · La taverne du Puits sec', 'Fuir par les toits']);
    expect(texte(pistes[0].querySelector('.lec-piste-texte span')!)).toBe('Gagner le combat');
    expect(pistes[0].tagName).toBe('BUTTON');
  });
});
