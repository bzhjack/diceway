import {Component, input} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {DiceBoxHostComponent} from '../../../../shared/dice-3d/dice-box-host';
import {BolHerosService} from '../../../services/bol-heros.service';
import {ACTION_DIFFICULTIES} from '../../action-roll.util';
import {ActionRollData, ActionRollPreset} from '../../models/action-roll.model';
import {ActionRollPanelComponent} from './action-roll-panel';

/** Le plateau de dés 3D charge un moteur : hors sujet ici. */
@Component({selector: 'app-dice-box-host', template: ''})
class DiceBoxStubComponent {
  readonly scale = input(8);
  readonly themeColor = input('');
  readonly theme = input('');
}

const GRIMAR: ActionRollData = {
  heroNom: 'Grimar',
  herosId: 'h1',
  heroisme: 3,
  agilite: 2,
  vigueur: 1,
  esprit: 0,
  aura: -1,
  equipementAgilite: 0,
  carrieres: [],
  diceTraits: [],
};
const ARDUE = ACTION_DIFFICULTIES.find((d) => d.label === 'Ardue')!;
const DIFFICILE = ACTION_DIFFICULTIES.find((d) => d.label === 'Difficile')!;

describe('ActionRollPanelComponent', () => {
  async function rendre(preset: ActionRollPreset | null = null) {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        {provide: BolHerosService, useValue: {}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    TestBed.overrideComponent(ActionRollPanelComponent, {remove: {imports: [DiceBoxHostComponent]}, add: {imports: [DiceBoxStubComponent]}});
    const fixture = TestBed.createComponent(ActionRollPanelComponent);
    fixture.componentRef.setInput('data', GRIMAR);
    fixture.componentRef.setInput('heroisme', 3);
    fixture.componentRef.setInput('preset', preset);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const attribut = () => texte(page.querySelector('.ard-medal[aria-pressed="true"] span'));
    const difficulte = () => texte(page.querySelector('.ard-ladder button[aria-pressed="true"] span'));
    return {fixture, page, attribut, difficulte};
  }

  it('sans préréglage, garde Agilité et Moyenne', async () => {
    const {attribut, difficulte} = await rendre();

    expect(attribut()).toBe('Agilité');
    expect(difficulte()).toBe('Moyenne');
  });

  it('applique l’attribut et la difficulté du préréglage', async () => {
    const {attribut, difficulte} = await rendre({attributs: ['vigueur'], difficulty: ARDUE});

    expect(attribut()).toBe('Vigueur');
    expect(difficulte()).toBe('Ardue');
  });

  it('prend le meilleur des deux attributs du héros', async () => {
    const {attribut} = await rendre({attributs: ['vigueur', 'agilite'], difficulty: ARDUE});

    expect(attribut()).toBe('Agilité');
  });

  it('un nouveau préréglage remplace le choix du MJ ; sans attribut, l’attribut ne change pas', async () => {
    const {fixture, page, attribut, difficulte} = await rendre({attributs: ['vigueur'], difficulty: ARDUE});

    [...page.querySelectorAll<HTMLButtonElement>('.ard-medal')].find((b) => b.textContent?.includes('Aura'))!.click();
    await fixture.whenStable();
    expect(attribut()).toBe('Aura');

    fixture.componentRef.setInput('preset', {attributs: ['esprit'], difficulty: DIFFICILE});
    await fixture.whenStable();
    expect(attribut()).toBe('Esprit');
    expect(difficulte()).toBe('Difficile');

    fixture.componentRef.setInput('preset', {attributs: [], difficulty: ARDUE});
    await fixture.whenStable();
    expect(attribut()).toBe('Esprit');
    expect(difficulte()).toBe('Ardue');
  });
});
