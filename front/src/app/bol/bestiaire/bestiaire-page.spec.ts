import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';
import {BolCreaturesService} from '../services/bol-creatures.service';
import {BolDemonsService} from '../services/bol-demons.service';
import {BestiairePageComponent} from './bestiaire-page';

describe('BestiairePageComponent', () => {
  it('réunit créatures et démons, comme l’Intendance armes et armures : leurs compteurs, de quoi les ouvrir et y créer une fiche', async () => {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        {provide: BolCreaturesService, useValue: {creatures: () => of([{user_id: null}, {user_id: null}, {user_id: 'moi'}])}},
        {provide: BolDemonsService, useValue: {demons: () => of([{user_id: 'moi'}])}},
      ],
    });
    const fixture = TestBed.createComponent(BestiairePageComponent);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element) => el.textContent?.replace(/\s+/g, ' ').trim();
    const cartes = [...page.querySelectorAll('.ip-entry-card')];

    expect(cartes.map((c) => texte(c.querySelector('.ip-entry-title')!))).toEqual(['Créatures', 'Démons']);
    expect([...cartes[0].querySelectorAll('dw-tag')].map(texte)).toEqual(['3 créatures', '2 du catalogue', '1 de mes fiches']);
    expect([...cartes[0].querySelectorAll('button')].map(texte)).toEqual(['add Créer une créature', 'arrow_forward Ouvrir les créatures']);
    expect([...page.querySelectorAll('.ip-header-card dw-tag')].map(texte)).toEqual(['4 fiches', '2 de mes fiches']);
  });
});
