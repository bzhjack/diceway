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

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{provide: SceneStageStore, useValue: {busy: signal(false), regionNoms: signal(new Map())}}],
    });
    fixture = TestBed.createComponent(SceneLectureComponent);
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau est dans la sacoche.'));
    fixture.componentRef.setInput('acts', []);
    await fixture.whenStable();
  });

  it('montre le secret du MJ sans qu’il soit flouté, ni masqué par un bouton', async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.lec-secret')?.textContent).toBe('Le sceau est dans la sacoche.');
    expect(host.querySelector('[aria-pressed]')).toBeNull();
    fixture.componentRef.setInput('scene', scene('s2', 'Jesharek ment.'));
    await fixture.whenStable();
    expect(host.querySelector('.lec-secret')?.textContent).toBe('Jesharek ment.');
  });

  it("affiche « En jeu » seulement quand la scène a des règles", async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('#lec-jeu-titre')).toBeNull();
    fixture.componentRef.setInput('scene', scene('s1', 'Le sceau est dans la sacoche.', 'Vigueur Ardu (-1) pour se dégager.'));
    await fixture.whenStable();
    expect(host.querySelector('#lec-jeu-titre')?.textContent).toContain('En jeu');
    expect(host.querySelector('.lec-jeu')?.textContent).toBe('Vigueur Ardu (-1) pour se dégager.');
  });

  it('propose d’agrandir la lecture, puis de la réduire quand elle est en grand', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const agrandir = (): HTMLButtonElement => host.querySelector<HTMLButtonElement>('button.lec-agrandir')!;
    const demandes: unknown[] = [];
    fixture.componentInstance.grandToggled.subscribe(() => demandes.push(true));

    expect(agrandir().getAttribute('aria-label')).toBe('Agrandir la lecture');
    expect(host.classList).not.toContain('lec--grand');
    agrandir().click();
    expect(demandes).toHaveLength(1);

    fixture.componentRef.setInput('grand', true);
    await fixture.whenStable();
    expect(agrandir().getAttribute('aria-label')).toBe('Réduire la lecture');
    expect(host.classList).toContain('lec--grand');
  });

  it('replie une section d’un clic sur son titre, et la rouvre au clic suivant', async () => {
    const host = fixture.nativeElement as HTMLElement;
    const titre = (): HTMLButtonElement => host.querySelector<HTMLButtonElement>('#lec-secret-titre .lec-deplier')!;
    expect(titre().getAttribute('aria-expanded')).toBe('true');
    expect(host.querySelector('.lec-secret')).not.toBeNull();

    titre().click();
    await fixture.whenStable();
    expect(titre().getAttribute('aria-expanded')).toBe('false');
    expect(host.querySelector('.lec-secret')).toBeNull();
    // Les autres sections restent ouvertes.
    expect(host.querySelector('.lec-texte')).not.toBeNull();

    titre().click();
    await fixture.whenStable();
    expect(host.querySelector('.lec-secret')).not.toBeNull();
  });

  it('rouvre les sections repliées quand la scène change', async () => {
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('#lec-lire-titre .lec-deplier')!.click();
    await fixture.whenStable();
    expect(host.querySelector('.lec-texte')).toBeNull();

    fixture.componentRef.setInput('scene', scene('s2', 'Jesharek ment.'));
    await fixture.whenStable();
    expect(host.querySelector('.lec-texte')).not.toBeNull();
  });
});
