import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of} from 'rxjs';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {SceneActe} from '../../models/theatre.model';
import {SceneApercuMenuComponent} from './scene-apercu-menu';
import {SceneStageStore} from './scene-stage.store';

const SCENE = {
  id: 's2',
  titre: 'L’ascension vers le Col Gelé',
  lieu: 'Le sentier du Col Gelé',
  moment: 'jour',
  meteo: null,
  danger: 2,
  distribution: [],
  pistes: null,
  region_id: null,
} as unknown as BolSceneModel;
const ACTE: SceneActe = {scene: SCENE, numero: 2, statut: 'a-venir'};

@Component({
  imports: [MatMenuModule, SceneApercuMenuComponent],
  template: `
    <button type="button" class="declencheur" [matMenuTriggerFor]="apercu.menu()" [matMenuTriggerData]="{acte}">2</button>
    <bol-scene-apercu-menu #apercu="apercuMenu" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HoteComponent {
  readonly acte = ACTE;
}

describe('SceneApercuMenuComponent', () => {
  async function ouvrir() {
    const store = {acts: signal([ACTE]), busy: signal(false), regionNom: () => null, load: vi.fn(() => of(null)), prepare: vi.fn()};
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        {provide: SceneStageStore, useValue: store},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    const fixture = TestBed.createComponent(HoteComponent);
    await fixture.whenStable();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.declencheur')!.click();
    await fixture.whenStable();
    const items = () => [...document.querySelectorAll<HTMLButtonElement>('.thr-apercu-menu .mat-mdc-menu-item')];
    const texte = (el: Element) => el.querySelector('.mat-mdc-menu-item-text')?.textContent?.replace(/\s+/g, ' ').trim();
    return {store, items, texte};
  }

  it('sous l’aperçu, « Charger la scène » puis « Modifier la scène »', async () => {
    const {items, texte} = await ouvrir();

    expect(items().map(texte)).toEqual(['Charger la scène', 'Modifier la scène']);
  });

  it('« Modifier la scène » ouvre la préparation de cette scène, sans la charger', async () => {
    const {store, items} = await ouvrir();

    items()[1].click();

    expect(store.prepare).toHaveBeenCalledWith(SCENE);
    expect(store.load).not.toHaveBeenCalled();
  });
});
