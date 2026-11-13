import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {MatTooltip} from '@angular/material/tooltip';
import {TuileComponent} from './tuile';

@Component({
  imports: [TuileComponent],
  template: `
    <bol-tuile [nom]="nom()" [image]="image()" [label]="nom() + ', voir son statbloc'" [vitalite]="vitalite()" [vitaliteMax]="vitaliteMax()" [heroisme]="heroisme()" (ouvrir)="ouvertures.set(ouvertures() + 1)">
      <span bolTuileCoin class="coin">Mes fiches</span>
      <button bolTuileMenu type="button" class="menu">⋯</button>
      <span bolTuileSous class="sous">Coriace</span>
    </bol-tuile>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HoteComponent {
  readonly nom = signal('Loup géant');
  readonly image = signal<string | null>('/a.webp');
  readonly vitalite = signal<number | null>(7);
  readonly vitaliteMax = signal<number | null>(null);
  readonly heroisme = signal<number | null>(null);
  readonly ouvertures = signal(0);
}

describe('TuileComponent', () => {
  async function monter(reglage: (hote: HoteComponent) => void = () => undefined) {
    const fixture = TestBed.createComponent(HoteComponent);
    reglage(fixture.componentInstance);
    await fixture.whenStable();
    return {fixture, el: fixture.nativeElement as HTMLElement};
  }
  const texte = (e: Element | null | undefined) => e?.textContent?.trim();

  it('montre le portrait, le nom et la vitalité', async () => {
    const {el} = await monter();

    expect(el.querySelector('.dw-tuile__portrait img')?.getAttribute('src')).toBe('/a.webp');
    expect(texte(el.querySelector('.dw-tuile__nom'))).toBe('Loup géant');
    expect(texte(el.querySelector('.dw-tuile__vies .dw-tuile__coeur b'))).toBe('7');
    expect(el.querySelector('button.dw-tuile__portrait')?.getAttribute('aria-label')).toBe('Loup géant, voir son statbloc');
    expect(el.querySelector('.dw-tuile--heros')).toBeNull();
  });

  it('sans portrait, montre l’initiale', async () => {
    const {el} = await monter((h) => h.image.set(null));

    expect(el.querySelector('.dw-tuile__portrait img')).toBeNull();
    expect(texte(el.querySelector('.dw-tuile__initiale'))).toBe('L');
  });

  it('un portrait introuvable laisse place à l’initiale', async () => {
    const {fixture, el} = await monter();
    el.querySelector('.dw-tuile__portrait img')!.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(el.querySelector('.dw-tuile__portrait img')).toBeNull();
    expect(texte(el.querySelector('.dw-tuile__initiale'))).toBe('L');
  });

  it('le portrait par défaut compte comme pas de portrait : l’initiale', async () => {
    const {el} = await monter((h) => h.image.set('/assets/bol/empty-avatar.jpg'));

    expect(el.querySelector('.dw-tuile__portrait img')).toBeNull();
    expect(texte(el.querySelector('.dw-tuile__initiale'))).toBe('L');
  });

  it('une vitalité inconnue, avec un maximum, garde son cœur : « — »', async () => {
    const {el} = await monter((h) => {
      h.vitalite.set(null);
      h.vitaliteMax.set(8);
    });

    expect(texte(el.querySelector('.dw-tuile__coeur b'))).toBe('—');
  });

  it('un nom coupé se lit en entier dans une infobulle ; un nom entier n’en a pas', async () => {
    const {fixture, el} = await monter();
    const portrait = el.querySelector<HTMLButtonElement>('button.dw-tuile__portrait')!;
    const infobulle = () => fixture.debugElement.query((d) => d.nativeElement === portrait).injector.get(MatTooltip);
    const nom = el.querySelector<HTMLElement>('.dw-tuile__nom')!;

    portrait.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(infobulle().disabled).toBe(true);

    Object.defineProperty(nom, 'scrollWidth', {configurable: true, value: 300});
    Object.defineProperty(nom, 'clientWidth', {configurable: true, value: 120});
    portrait.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(infobulle().disabled).toBe(false);
    expect(infobulle().message).toBe('Loup géant');
  });

  it('sans vitalité, pas de cœur', async () => {
    const {el} = await monter((h) => h.vitalite.set(null));

    expect(el.querySelector('.dw-tuile__coeur')).toBeNull();
  });

  it('un héros a son pied : écusson et cœur', async () => {
    const {el} = await monter((h) => h.heroisme.set(3));

    expect(el.querySelector('.dw-tuile--heros')).not.toBeNull();
    expect(texte(el.querySelector('.dw-tuile__pied .dw-tuile__ecusson b'))).toBe('3');
    expect(texte(el.querySelector('.dw-tuile__pied .dw-tuile__coeur b'))).toBe('7');
    expect(el.querySelector('.dw-tuile__vies')).toBeNull();
  });

  it('émet ouvrir au clic sur le portrait', async () => {
    const {fixture, el} = await monter();
    el.querySelector<HTMLButtonElement>('button.dw-tuile__portrait')!.click();

    expect(fixture.componentInstance.ouvertures()).toBe(1);
  });

  it('projette le coin, le menu et la ligne du dessous', async () => {
    const {el} = await monter();

    expect(texte(el.querySelector('.dw-tuile__coin .coin'))).toBe('Mes fiches');
    expect(el.querySelector('.dw-tuile__menu .menu')).not.toBeNull();
    expect(texte(el.querySelector('.dw-tuile__sous .sous'))).toBe('Coriace');
  });
});
