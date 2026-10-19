import {TestBed} from '@angular/core/testing';
import {Subject} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {TapisCard} from '../../models/tapis.model';
import {CompagnieComponent} from './compagnie';

function hero(vitaliteCourante: number): TapisCard {
  return {
    key: 'hero-1',
    kind: 'hero',
    camp: 'heros',
    pivotId: 1,
    sourceId: 'h1',
    nom: 'Grimar',
    avatar: '',
    badge: null,
    rang: null,
    degats: 'd6',
    defense: '1',
    vitaliteCourante,
    vitaliteMax: 11,
    joueur: 'Clara',
    heroisme: 2,
    attitude: null,
    vilenie: null,
  };
}

describe('CompagnieComponent', () => {
  const enCours = new Subject<unknown>();
  const applyDamage = vi.fn(() => enCours);
  const adjustHeroisme = vi.fn(() => enCours);

  const ouvertes: TapisCard[] = [];

  async function rendre(card: TapisCard): Promise<HTMLElement> {
    ouvertes.length = 0;
    applyDamage.mockClear();
    adjustHeroisme.mockClear();
    TestBed.configureTestingModule({
      providers: [
        {provide: BolFightSessionService, useValue: {applyDamage}},
        {provide: BolHerosService, useValue: {adjustHeroisme}},
      ],
    });
    const fixture = TestBed.createComponent(CompagnieComponent);
    fixture.componentRef.setInput('cards', [card]);
    fixture.componentRef.setInput('sessionId', 'sess');
    fixture.componentInstance.cardToggled.subscribe((ouverte) => ouvertes.push(ouverte));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const bouton = (element: HTMLElement, label: string): HTMLButtonElement => element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;

  it('pendant un enregistrement, ignore un second pas sans faire pâlir le bouton', async () => {
    const element = await rendre(hero(8));
    const moins = bouton(element, 'Retirer 1 point de vitalité à Grimar');
    moins.click();
    TestBed.tick();
    expect(applyDamage).toHaveBeenCalledTimes(1);
    expect(moins.disabled).toBe(false);
    expect(moins.getAttribute('aria-disabled')).toBeNull();
    moins.click();
    expect(applyDamage).toHaveBeenCalledTimes(1);
  });

  it('un pas d’héroïsme en cours ne touche pas aux boutons de vitalité, qui restent utilisables', async () => {
    const element = await rendre(hero(8));
    bouton(element, 'Ajouter 1 point d’héroïsme à Grimar').click();
    TestBed.tick();
    expect(adjustHeroisme).toHaveBeenCalledTimes(1);
    expect(bouton(element, 'Retirer 1 point de vitalité à Grimar').getAttribute('aria-disabled')).toBeNull();
    expect(bouton(element, 'Rendre 1 point de vitalité à Grimar').getAttribute('aria-disabled')).toBeNull();
    bouton(element, 'Retirer 1 point de vitalité à Grimar').click();
    expect(applyDamage).toHaveBeenCalledTimes(1);
  });

  it('ignore un pas au-delà du maximum de vitalité, sans désactiver le bouton', async () => {
    const element = await rendre(hero(11));
    const plus = element.querySelector<HTMLButtonElement>('[aria-label="Rendre 1 point de vitalité à Grimar"]')!;
    expect(plus.disabled).toBe(false);
    expect(plus.getAttribute('aria-disabled')).toBe('true');
    plus.click();
    expect(applyDamage).not.toHaveBeenCalled();
  });

  it('le dé de la plaque ouvre la carte du héros, où se trouve son jet d’action', async () => {
    const card = hero(8);
    const element = await rendre(card);
    bouton(element, 'Jet d’action de Grimar').click();
    expect(ouvertes).toEqual([card]);
  });
});
