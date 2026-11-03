import {provideHttpClient} from '@angular/common/http';
import {ApplicationRef, ChangeDetectionStrategy, Component} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {provideRouter} from '@angular/router';
import {NEVER, Observable, of, throwError} from 'rxjs';
import {BolAccueilModel} from '../../models/bol-accueil.model';
import {BolAccueilService} from '../../services/bol-accueil.service';
import {CloseTableService} from '../../shared/close-table/close-table.service';
import {AccountMenuComponent} from '../../shared/account-menu/account-menu';
import {AccueilPageComponent} from './accueil-page';

/** Le menu du compte tire l'authentification Google : il a ses propres tests. */
@Component({selector: 'bol-account-menu', template: '', changeDetection: ChangeDetectionStrategy.OnPush})
class AccountMenuStubComponent {}

const DATA: BolAccueilModel = {
  table: {id: 't1', titre: null, statut: 'libre', scenario_id: 'p1', created_at: '2026-11-02T10:00:00Z'},
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
  const clore = vi.fn(() => of(true));

  /** `suivante` : la réponse des lectures d'après la première. */
  async function rendre(reponse: Observable<BolAccueilModel> = of(DATA), suivante = reponse): Promise<HTMLElement> {
    const accueil = vi.fn(() => suivante).mockReturnValueOnce(reponse);
    TestBed.configureTestingModule({
      imports: [MatIconTestingModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {provide: BolAccueilService, useValue: {accueil}},
        {provide: CloseTableService, useValue: {clore}},
      ],
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

  it('garde la teinte de la saga de la table ouverte quand son scénario en écrit le nom dans une autre casse', async () => {
    const page = await rendre(
      of({
        ...DATA,
        table: {...DATA.table!, scenario_id: 'p3'},
        scenarios: [...DATA.scenarios, {id: 'p3', titre: 'PERLE DU BESHAAR — 3. La casse'}],
      }),
    );
    const teinteDeLaCarte = [...page.querySelectorAll('.acc-saga')]
      .find((carte) => carte.textContent?.includes('Perle du Beshaar'))!
      .className.match(/acc-teinte--(\d)/)![1];

    expect(teinteDeLaCarte).not.toBe('0');
    expect(page.querySelector('.acc-etiquette')?.classList).toContain(`acc-teinte--${teinteDeLaCarte}`);
  });

  it('clôt la table ouverte depuis le bandeau, puis relit l’accueil', async () => {
    const page = await rendre(of(DATA), of({...DATA, table: null, scenarios_joues: ['p1']}));
    const bouton = [...page.querySelectorAll<HTMLButtonElement>('.acc-soir button')].find((b) => b.textContent?.includes('Clore la table'))!;

    bouton.click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(clore).toHaveBeenCalledWith({id: 't1', enCombat: false});
    expect(page.querySelector('.acc-soir-titre')?.textContent).toContain('Aucune table ouverte');
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
    expect(sagas[0].querySelector('.acc-saga-resume')?.textContent).toBe('Sur la table ce soir · 0 chapitre joué sur 2');
    const suite = sagas[0].querySelector<HTMLAnchorElement>('.acc-saga-suite')!;
    expect(suite.getAttribute('href')).toBe('/session/new?scenario=p2');
    expect(suite.getAttribute('aria-label')).toBe("Continuer Perle du Beshaar : 2. De sable et d'eau, sur une nouvelle table");
    expect(sagas[1].querySelector('.acc-saga-suite-label')?.textContent).toBe('Commencer');
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

  it('pendant le chargement, le bandeau n’affirme rien : il se dit occupé', async () => {
    const page = await rendre(NEVER);
    const bandeau = page.querySelector('.acc-soir')!;

    expect(bandeau.textContent).not.toContain('Aucune table ouverte');
    expect(bandeau.querySelector('a[href="/session/new"]')).toBeNull();
    expect(bandeau.getAttribute('aria-busy')).toBe('true');
    expect(bandeau.querySelector('[role="status"]')?.textContent).toContain('Chargement');
  });

  it('une fois l’accueil arrivé, le bandeau n’est plus occupé', async () => {
    const page = await rendre();

    expect(page.querySelector('.acc-soir')?.getAttribute('aria-busy')).toBe('false');
  });

  it('dit quand l’accueil ne se charge pas, dans le bandeau, sans prétendre qu’aucune table n’est ouverte', async () => {
    const page = await rendre(throwError(() => new Error('réseau')));
    const bandeau = page.querySelector('.acc-soir')!;
    const alertes = page.querySelectorAll('[role="alert"]');

    expect(bandeau.textContent).not.toContain('Aucune table ouverte');
    expect(alertes.length).toBe(1);
    expect(bandeau.querySelector('[role="alert"]')?.textContent).toContain('Impossible de charger la table ouverte et les scénarios');
    expect(bandeau.querySelector<HTMLAnchorElement>('a[href="/library/sessions"]')?.textContent).toContain('Mes sessions');
  });

  it('la compagnie n’affirme rien tant que l’accueil n’est pas arrivé', async () => {
    const page = await rendre(NEVER);

    expect(page.querySelector('.acc-compagnie')?.textContent).not.toContain('Pas encore de compagnie');
  });

  it('la compagnie n’affirme rien si l’accueil échoue', async () => {
    const page = await rendre(throwError(() => new Error('réseau')));

    expect(page.querySelector('.acc-compagnie')?.textContent).not.toContain('Pas encore de compagnie');
  });
});
