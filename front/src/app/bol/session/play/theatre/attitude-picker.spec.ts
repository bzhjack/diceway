import {TestBed} from '@angular/core/testing';
import {Subject} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {TapisCard} from '../../models/tapis.model';
import {AttitudePickerComponent} from './attitude-picker';

const PNJ: TapisCard = {
  key: 'pnj-7',
  kind: 'pnj',
  camp: 'adversaires',
  pivotId: 7,
  sourceId: '13',
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
  vilenie: null,
};

describe('AttitudePickerComponent', () => {
  it('pendant un enregistrement, n’envoie qu’un choix à la fois, sans faire pâlir les autres options', async () => {
    const enCours = new Subject<unknown>();
    const setAttitude = vi.fn(() => enCours);
    TestBed.configureTestingModule({providers: [{provide: BolFightSessionService, useValue: {setAttitude}}]});
    const fixture = TestBed.createComponent(AttitudePickerComponent);
    fixture.componentRef.setInput('sessionId', 'sess');
    fixture.componentRef.setInput('card', PNJ);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const [hostile, mefiant] = Array.from(element.querySelectorAll<HTMLButtonElement>('.atp-option'));

    hostile.click();
    TestBed.tick();

    expect(setAttitude).toHaveBeenCalledWith('sess', 'pnj', 7, 'hostile');
    expect(hostile.disabled).toBe(false);
    expect(mefiant.getAttribute('aria-disabled')).toBeNull();
    mefiant.click();
    expect(setAttitude).toHaveBeenCalledTimes(1);
  });
});
