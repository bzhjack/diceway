import {TestBed} from '@angular/core/testing';
import {Subject} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {TapisCard} from '../../models/tapis.model';
import {CardVilenieComponent} from './card-vilenie';

function rival(vilenie: number): TapisCard {
  return {
    key: 'pnj-7',
    kind: 'pnj',
    camp: 'adversaires',
    pivotId: 7,
    sourceId: '15',
    nom: 'Kalzatan',
    avatar: '',
    badge: 'Rival',
    rang: 'Rival',
    degats: 'd6',
    defense: '1',
    vitaliteCourante: 15,
    vitaliteMax: 15,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie,
  };
}

describe('CardVilenieComponent', () => {
  const enCours = new Subject<unknown>();
  const adjustVilenie = vi.fn(() => enCours);

  async function rendre(card: TapisCard): Promise<HTMLElement> {
    adjustVilenie.mockClear();
    TestBed.configureTestingModule({providers: [{provide: BolFightSessionService, useValue: {adjustVilenie}}]});
    const fixture = TestBed.createComponent(CardVilenieComponent);
    fixture.componentRef.setInput('sessionId', 'sess');
    fixture.componentRef.setInput('card', card);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('dépense un point ; pendant l’enregistrement, ignore un second pas sans faire pâlir le bouton', async () => {
    const element = await rendre(rival(2));
    const moins = element.querySelector<HTMLButtonElement>('[aria-label="Retirer 1 point de vilénie à Kalzatan"]')!;
    moins.click();
    TestBed.tick();
    expect(adjustVilenie).toHaveBeenCalledWith('sess', 7, -1);
    expect(moins.disabled).toBe(false);
    expect(moins.getAttribute('aria-disabled')).toBeNull();
    moins.click();
    expect(adjustVilenie).toHaveBeenCalledTimes(1);
  });

  it('ne dépense rien à 0 point', async () => {
    const element = await rendre(rival(0));
    element.querySelector<HTMLButtonElement>('[aria-label="Retirer 1 point de vilénie à Kalzatan"]')!.click();
    expect(adjustVilenie).not.toHaveBeenCalled();
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('0 point de vilénie');
  });
});
