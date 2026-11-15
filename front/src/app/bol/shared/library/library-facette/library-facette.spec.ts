import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatIconTestingModule} from '@angular/material/icon/testing';
import {LibraryOption} from '../../models/library-rows.model';
import {LibraryFacetteComponent} from './library-facette';

const SCENARIOS: LibraryOption<string | null>[] = [
  'Chroniques lémuriennes',
  'Perle du Beshaar',
  'Le Dieu voilé',
  'La Cité des Cent Tours',
  'Les Sables de Klaar',
  'Le Tombeau d’Ashtoreth',
  'La Nef de Khalaman',
  'Les Jardins de Lysor',
  'L’Hiver sur Qush',
  'Le Masque de Pandaria',
].map((label, i) => ({cle: `s${i}`, label, compte: 10 - i, teinte: (i % 4) + 1}));

@Component({
  imports: [LibraryFacetteComponent],
  template: `<bol-library-facette titre="Scénario" tous="Tous les scénarios" [total]="62" [options]="options()" [(valeur)]="valeur" [vide]="null" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HoteComponent {
  readonly options = signal(SCENARIOS);
  readonly valeur = signal<string | null>(null);
}

describe('LibraryFacetteComponent', () => {
  async function rendre(options = SCENARIOS) {
    TestBed.configureTestingModule({imports: [MatIconTestingModule]});
    const fixture = TestBed.createComponent(HoteComponent);
    fixture.componentInstance.options.set(options);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    const declencheur = () => page.querySelector<HTMLButtonElement>('.dw-lr-choix')!;
    const options_ = () => [...document.querySelectorAll<HTMLButtonElement>('.dw-lr-menu .dw-lr-option')];
    /** Chaque option de la liste ouverte : son libellé et son nombre. */
    const lignes = () => options_().map((o) => [texte(o.querySelector('.dw-lr-option-label')), texte(o.querySelector('.dw-lr-option-compte'))]);
    const ouvrir = async () => {
      declencheur().click();
      await fixture.whenStable();
    };
    return {fixture, texte, declencheur, options: options_, lignes, ouvrir};
  }

  it('dit son titre tant que rien n’est choisi, puis la valeur, bordé d’or ; la liste se referme sur le choix', async () => {
    const {fixture, texte, declencheur, options, lignes, ouvrir} = await rendre();
    expect(texte(declencheur().querySelector('.dw-lr-choix-valeur'))).toBe('Scénario');
    expect(declencheur().getAttribute('aria-expanded')).toBe('false');

    await ouvrir();
    expect(declencheur().getAttribute('aria-expanded')).toBe('true');
    expect(lignes()[0]).toEqual(['Tous les scénarios', '62']);
    expect(options()[0].getAttribute('aria-pressed')).toBe('true');
    options().find((o) => texte(o)?.startsWith('Les Sables de Klaar'))!.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.valeur()).toBe('s4');
    expect(document.querySelector('.dw-lr-menu')).toBeNull();
    expect(texte(declencheur().querySelector('.dw-lr-choix-valeur'))).toBe('Les Sables de Klaar');
    expect(declencheur().classList).toContain('dw-lr-choix--pose');
    expect(declencheur().querySelector('.dw-lr-point')?.classList).toContain('dw-saga--1');
  });

  it('au-delà de huit options, la liste a sa recherche', async () => {
    const {fixture, lignes, ouvrir} = await rendre();
    await ouvrir();
    const champ = document.querySelector<HTMLInputElement>('.dw-lr-menu-recherche input')!;

    champ.value = 'sables';
    champ.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(lignes()).toEqual([
      ['Tous les scénarios', '62'],
      ['Les Sables de Klaar', '6'],
    ]);
  });

  it('huit options ou moins : pas de recherche', async () => {
    const {ouvrir} = await rendre(SCENARIOS.slice(0, 8));
    await ouvrir();

    expect(document.querySelector('.dw-lr-menu')).not.toBeNull();
    expect(document.querySelector('.dw-lr-menu-recherche')).toBeNull();
  });

  it('« Tous les scénarios », ou un clic sur l’option choisie, retire le filtre ; Échap referme la liste', async () => {
    const {fixture, texte, options, ouvrir} = await rendre();
    fixture.componentInstance.valeur.set('s1');
    await fixture.whenStable();

    await ouvrir();
    options().find((o) => texte(o)?.startsWith('Perle du Beshaar'))!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.valeur()).toBeNull();

    fixture.componentInstance.valeur.set('s2');
    await ouvrir();
    options()[0].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.valeur()).toBeNull();

    await ouvrir();
    document.querySelector('.dw-lr-menu')!.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    await fixture.whenStable();
    expect(document.querySelector('.dw-lr-menu')).toBeNull();
  });
});
