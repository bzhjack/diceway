import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {MatSnackBar} from '@angular/material/snack-bar';
import {of} from 'rxjs';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {HeroResourcesData} from '../../models/hero-resources.model';
import {HeroResourcesComponent} from './hero-resources';

const DATA: HeroResourcesData = {
  sessionId: 's1',
  herosId: 'h1',
  pivotId: 1,
  heroNom: 'Axel',
  vitaliteCourante: 10,
  vitaliteMax: 10,
  foi: 1,
  foiMax: 3,
  pouvoir: 10,
  pouvoirMax: 12,
};

describe('HeroResourcesComponent : récupérer la foi et le pouvoir', () => {
  async function rendre(data: HeroResourcesData) {
    const adjustRessource = vi.fn((_id: string, ressource: 'foi' | 'pouvoir', delta: number) =>
      of({ressources: {foi: data.foi + (ressource === 'foi' ? delta : 0), pouvoir: data.pouvoir + (ressource === 'pouvoir' ? delta : 0)}}),
    );
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        {provide: BolHerosService, useValue: {adjustRessource}},
        {provide: BolFightSessionService, useValue: {}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    const fixture = TestBed.createComponent(HeroResourcesComponent);
    fixture.componentRef.setInput('data', data);
    fixture.componentRef.setInput('heroisme', 2);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const ouvrir = async () => {
      page.querySelector<HTMLButtonElement>('.hrs-recuperer')!.click();
      await fixture.whenStable();
      return [...document.querySelectorAll<HTMLButtonElement>('.mat-mdc-menu-item')];
    };
    return {page, fixture, adjustRessource, ouvrir};
  }

  it('montre la foi et le pouvoir sur leur réserve maximale, et ce que chaque récupération rendrait vraiment', async () => {
    const {page, ouvrir} = await rendre(DATA);

    expect([...page.querySelectorAll('.hrs-reserve')].map((e) => e.textContent?.trim())).toEqual(['Foi 1/3', 'Pouvoir 10/12']);
    expect((await ouvrir()).map((b) => b.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      'Midi ou minuit (1er cercle) · +2',
      'Pleine lune (2e et 3e cercles) · +2',
      'Charmes : réserve pleine · +2',
      'Dévotions, 1 h · +1',
      'Dévotions, 2 h · +2',
      'Dévotions, 3 h · +2',
      'Dévotions, 4 h · +2',
    ]);
  });

  it('rend les points sur la fiche, sans dépasser la réserve', async () => {
    const {page, fixture, adjustRessource, ouvrir} = await rendre(DATA);

    (await ouvrir())[6].click();
    await fixture.whenStable();

    expect(adjustRessource).toHaveBeenCalledWith('h1', 'foi', 2);
    expect(page.querySelector('.hrs-reserve')?.textContent?.trim()).toBe('Foi 3/3');
  });

  it('sans carrière de prêtre ni de sorcier, pas de tuile Magie', async () => {
    const {page} = await rendre({...DATA, foiMax: null, pouvoirMax: null});

    expect(page.querySelector('.hrs-recuperer')).toBeNull();
  });
});
