import {TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {SceneCartoucheComponent} from './scene-cartouche';

function scene(region_id: number | null, lieu: string | null): BolSceneModel {
  return {
    id: 's1',
    scenario_id: null,
    titre: 'Embuscade au gué',
    ordre: 0,
    notes: null,
    distribution: [],
    region_id,
    lieu,
    moment: null,
    meteo: null,
    danger: null,
    lecture: null,
    jeu: null,
    pistes: null,
    image: null,
  };
}

describe('SceneCartoucheComponent', () => {
  const open = vi.fn();

  async function rendre(s: BolSceneModel, regionNom: string | null): Promise<HTMLElement> {
    open.mockClear();
    TestBed.configureTestingModule({providers: [{provide: MatDialog, useValue: {open}}]});
    const fixture = TestBed.createComponent(SceneCartoucheComponent);
    fixture.componentRef.setInput('scene', s);
    fixture.componentRef.setInput('regionNom', regionNom);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('ouvre la carte depuis le lieu, centrée sur la région de la scène', async () => {
    const element = await rendre(scene(5, 'Gué du Tyr'), 'Jungle de Qush');
    const lieu = element.querySelector<HTMLButtonElement>('button.ctc-lieu-carte')!;
    expect(lieu.textContent).toContain('Gué du Tyr, Jungle de Qush');
    expect(lieu.getAttribute('aria-label')).toBe('Gué du Tyr, Jungle de Qush : voir sur la carte');

    lieu.click();

    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][1].data).toEqual({lieu: 'Gué du Tyr, Jungle de Qush', point: {x: 26.4, y: 59}});
  });

  it('sans région, le lieu reste un simple texte', async () => {
    const element = await rendre(scene(null, 'Gué du Tyr'), null);
    expect(element.querySelector('button.ctc-lieu-carte')).toBeNull();
    expect(element.querySelector('.ctc-lieu')?.textContent).toContain('Gué du Tyr');
  });
});
