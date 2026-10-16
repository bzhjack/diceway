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
  };
}

describe('CompagnieComponent', () => {
  const enCours = new Subject<unknown>();
  const applyDamage = vi.fn(() => enCours);

  async function rendre(card: TapisCard): Promise<HTMLElement> {
    applyDamage.mockClear();
    TestBed.configureTestingModule({
      providers: [
        {provide: BolFightSessionService, useValue: {applyDamage}},
        {provide: BolHerosService, useValue: {adjustHeroisme: () => enCours}},
      ],
    });
    const fixture = TestBed.createComponent(CompagnieComponent);
    fixture.componentRef.setInput('cards', [card]);
    fixture.componentRef.setInput('sessionId', 'sess');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('garde le bouton focalisable pendant un enregistrement', async () => {
    const element = await rendre(hero(8));
    const moins = element.querySelector<HTMLButtonElement>('[aria-label="Retirer 1 point de vitalité à Grimar"]')!;
    moins.click();
    TestBed.tick();
    expect(applyDamage).toHaveBeenCalledTimes(1);
    expect(moins.disabled).toBe(false);
    expect(moins.getAttribute('aria-disabled')).toBe('true');
    moins.click();
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
});
