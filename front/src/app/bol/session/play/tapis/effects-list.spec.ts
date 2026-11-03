import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {NewEffect} from '../../models/combat-effect.model';
import {EffectsListComponent} from './effects-list';

describe('EffectsListComponent : effet libre', () => {
  async function rendre() {
    TestBed.configureTestingModule({imports: [MatIconTestingModule]});
    const fixture = TestBed.createComponent(EffectsListComponent);
    fixture.componentRef.setInput('effets', []);
    fixture.componentRef.setInput('cartes', [
      {key: 'hero-1', nom: 'Grimar'},
      {key: 'pnj-7', nom: 'Kalzatan'},
    ]);
    const ajoutes: NewEffect[] = [];
    fixture.componentInstance.ajoute.subscribe((e) => ajoutes.push(e));
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const stable = async () => {
      await fixture.whenStable();
      TestBed.tick();
    };
    const segment = (nom: string) => [...element.querySelectorAll<HTMLButtonElement>('.efl-seg')].find((b) => (b.textContent ?? '').trim() === nom)!;
    return {fixture, element, ajoutes, stable, segment};
  }

  it('pose un effet nommé, sur la statistique, la valeur et la durée choisies', async () => {
    const {fixture, element, ajoutes, stable, segment} = await rendre();
    fixture.componentInstance['ouvrirLibre']('pnj-7');
    await stable();
    expect(element.textContent).toContain('Effet libre · Kalzatan');

    const nom = element.querySelector<HTMLInputElement>('.efl-libre input[type="text"]')!;
    nom.value = 'à couvert';
    nom.dispatchEvent(new Event('input'));
    segment('Défense').click();
    await stable();
    element.querySelector<HTMLButtonElement>('.efl-libre .vs__btn[aria-label="Augmenter"]')!.click();
    segment('1 attaques subies').click();
    await stable();
    element.querySelector<HTMLFormElement>('.efl-libre')!.dispatchEvent(new Event('submit'));
    await stable();

    expect(ajoutes).toEqual([
      {origine: 'manuel', libelle: 'à couvert', porteur: 'pnj-7', stat: 'defense', valeur: 2, quand: 'subie', duree: {type: 'usages', restants: 1}, manuel: true},
    ]);
    expect(element.querySelector('.efl-libre')).toBeNull();
  });

  it('un effet d’action est un dé de malus, sans valeur à régler', async () => {
    const {fixture, element, ajoutes, stable, segment} = await rendre();
    fixture.componentInstance['ouvrirLibre']('hero-1');
    await stable();
    segment('Action').click();
    await stable();
    expect(element.querySelector('.efl-libre dw-value-stepper')).toBeNull();
    element.querySelector<HTMLFormElement>('.efl-libre')!.dispatchEvent(new Event('submit'));
    await stable();
    expect(ajoutes[0]).toMatchObject({porteur: 'hero-1', stat: 'action', valeur: -1, libelle: 'dé de malus', duree: {type: 'action-porteur'}});
  });
});
