import {signal} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {SceneLectureComponent} from './scene-lecture';
import {SceneStageStore} from './scene-stage.store';

function scene(id: string, notes: string, jeu: string | null = null): BolSceneModel {
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
    pistes: null,
    image: null,
  };
}

describe('SceneLectureComponent', () => {
  let fixture: ComponentFixture<SceneLectureComponent>;

  const bouton = (): HTMLButtonElement =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')).find((b) => b.hasAttribute('aria-pressed'))!;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{provide: SceneStageStore, useValue: {busy: signal(false), regionNoms: signal(new Map())}}],
    });
    fixture = TestBed.createComponent(SceneLectureComponent);
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau est dans la sacoche.'));
    fixture.componentRef.setInput('acts', []);
    await fixture.whenStable();
    bouton().click();
    await fixture.whenStable();
  });

  it('garde le secret affiché quand la même scène revient préparée', async () => {
    expect(bouton().getAttribute('aria-pressed')).toBe('true');
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau est dans la sacoche du chef.'));
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-pressed')).toBe('true');
  });

  it('floute de nouveau le secret quand la scène change', async () => {
    fixture.componentRef.setInput('scene', scene('s2', 'Jesharek ment.'));
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-pressed')).toBe('false');
  });

  it("affiche « En jeu » seulement quand la scène a des règles", async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#lec-jeu-titre')).toBeNull();
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau est dans la sacoche.', 'Vigueur Ardu (-1) pour se dégager.'));
    await fixture.whenStable();
    expect(host.querySelector('#lec-jeu-titre')?.textContent).toContain('En jeu');
    expect(host.querySelector('.lec-jeu')?.textContent).toBe('Vigueur Ardu (-1) pour se dégager.');
  });
});
