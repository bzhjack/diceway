import {provideHttpClient} from '@angular/common/http';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideRouter} from '@angular/router';
import {of, throwError} from 'rxjs';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {AccueilPageComponent} from './accueil-page';

/** Le menu du compte tire l'authentification Google : il a ses propres tests. */
@Component({selector: 'bol-account-menu', template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class AccountMenuStubComponent {}

const DATA: BolAccueilModel = {
  table: {id: 't1', titre: null, scenario_id: 'p1', created_at: '2026-11-02T10:00:00Z'},
  scenarios: [
    {id: 'p1', titre: 'Perle du Beshaar — 1. Sacrilège à Satarla'},
    {id: 'p2', titre: "Perle du Beshaar — 2. De sable et d'eau"},
    {id: 'dv1', titre: "Le Dieu voilé — 1. L'oracle de Nemmereth"},
  ],
  scenarios_joues: ['p1'],
  scenario_recent_id: 'p1',
  derniers_heros: ['h1', 'h2'],
  compagnie: [
    {id: 'h1', nom: 'Axel', avatar: null},
    {id: 'h2', nom: 'jadawin', avatar: '/api/bol/portraits/abc.png'},
  ],
  comptes: {heros: 5, pnjs: 196, creatures: 103, demons: 15, armes: 54, armures: 6, sessions: 1},
};

describe('AccueilPageComponent', () => {
  async function rendre(reponse = of(DATA)): Promise<HTMLElement> {
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [provideRouter([]), provideHttpClient(), {provide: BolAccueilService, useValue: {accueil: () => reponse}}],
    });
    TestBed.overrideComponent(AccueilPageComponent, {remove: {imports: [AccountMenuComponent]}, add: {imports: [AccountMenuStubComponent]}});
    const fixture = TestBed.createComponent(AccueilPageComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('montre la table ouverte, sa saga et de quoi la reprendre', async () => {
    const page = await rendre();

    expect(page.querySelector('.acc-etiquette')?.textContent).toContain('Table ouverte · Perle du Beshaar');
    expect(page.querySelector('.acc-soir-titre')?.textContent).toContain('1. Sacrilège à Satarla');
    expect(page.querySelector<HTMLAnchorElement>('.acc-soir a')?.getAttribute('href')).toBe('/session/t1/play');
  });

  it('nomme la compagnie, avec un portrait quand le héros en a un', async () => {
    const page = await rendre();
    const heros = [...page.querySelectorAll('.acc-heros')];

    expect(heros.map((h) => h.textContent?.trim().replace(/\s+/g, ' '))).toEqual(['A Axel', 'jadawin']);
    expect(heros[1].querySelector('img')?.getAttribute('src')).toBe('/api/bol/portraits/abc.png');
  });

  it('résume chaque saga sans ses chapitres, et propose d’ouvrir la suite sur une nouvelle table', async () => {
    const page = await rendre();
    const sagas = [...page.querySelectorAll('.acc-saga')];

    expect(sagas.map((s) => s.querySelector('.acc-saga-nom')?.textContent)).toEqual(['Perle du Beshaar', 'Le Dieu voilé']);
    expect(sagas[0].querySelector('.acc-saga-resume')?.textContent).toBe('Sur la table ce soir');
    const suite = sagas[0].querySelector<HTMLAnchorElement>('.acc-saga-suite')!;
    expect(suite.getAttribute('href')).toBe('/session/new?scenario=p2');
    expect(suite.getAttribute('aria-label')).toBe("Continuer Perle du Beshaar : 2. De sable et d'eau, sur une nouvelle table");
    expect(sagas[0].querySelector('svg')?.getAttribute('aria-label')).toBe('0 chapitres joués sur 2');
  });

  it('compte les fiches de chaque bibliothèque et ne propose de créer que des fiches', async () => {
    const page = await rendre();
    const tuiles = [...page.querySelectorAll('.acc-biblio')];

    expect(tuiles.map((t) => t.querySelector('.acc-biblio-lien')?.getAttribute('aria-label'))).toEqual([
      'Héros, 5', 'PNJ, 196', 'Créatures, 103', 'Démons, 15', 'Armes, 54', 'Armures, 6', 'Sessions, 1',
    ]);
    expect(tuiles.map((t) => t.querySelector('.acc-biblio-plus')?.getAttribute('aria-label') ?? null)).toEqual([
      'Créer un héros', 'Créer un PNJ', 'Créer une créature', 'Créer un démon', null, null, null,
    ]);
  });

  it('sans table ni compagnie, propose d’en ouvrir une', async () => {
    const page = await rendre(of({...DATA, table: null, compagnie: [], derniers_heros: []}));

    expect(page.querySelector('.acc-soir-titre')?.textContent).toContain('Aucune table ouverte');
    expect(page.querySelector<HTMLAnchorElement>('.acc-soir a')?.getAttribute('href')).toBe('/session/new');
    expect(page.querySelector('.acc-compagnie')?.textContent).toContain('Pas encore de compagnie');
  });

  it('dit quand les scénarios ne se chargent pas', async () => {
    const page = await rendre(throwError(() => new Error('réseau')));

    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger les scénarios');
  });
});
