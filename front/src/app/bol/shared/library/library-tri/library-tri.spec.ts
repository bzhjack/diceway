import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {LibraryTri, LibraryTriOption} from '../../models/library-rows.model';
import {LibraryTriComponent} from './library-tri';

@Component({
  imports: [LibraryTriComponent],
  template: `<bol-library-tri [options]="options" [tri]="tri()" (cle)="cles.set([...cles(), $event])" (inverser)="inversions.set(inversions() + 1)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HoteComponent {
  readonly options: LibraryTriOption<string>[] = [
    {cle: 'nom', label: 'Nom'},
    {cle: 'type', label: 'Rang'},
    {cle: 'vitalite', label: 'Vitalité'},
  ];
  readonly tri = signal<LibraryTri<string>>({cle: 'nom', croissant: true});
  readonly cles = signal<string[]>([]);
  readonly inversions = signal(0);
}

describe('LibraryTriComponent', () => {
  async function monter() {
    const fixture = TestBed.createComponent(HoteComponent);
    await fixture.whenStable();
    return {fixture, el: fixture.nativeElement as HTMLElement};
  }

  it('choisit la clé du tri', async () => {
    const {fixture, el} = await monter();
    el.querySelector<HTMLElement>('mat-select[aria-label="Trier par"] .mat-mdc-select-trigger')!.click();
    await fixture.whenStable();
    [...document.querySelectorAll<HTMLElement>('mat-option')].find((o) => o.textContent?.trim() === 'Vitalité')!.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.cles()).toEqual(['vitalite']);
  });

  it('inverse le sens, et dit le sens actuel', async () => {
    const {fixture, el} = await monter();
    const bouton = () => el.querySelector<HTMLButtonElement>('button.dw-lr-sens')!;

    expect(bouton().getAttribute('aria-label')).toBe('Ordre croissant, inverser');
    expect(bouton().textContent?.trim()).toBe('arrow_upward');
    bouton().click();
    expect(fixture.componentInstance.inversions()).toBe(1);

    fixture.componentInstance.tri.set({cle: 'nom', croissant: false});
    await fixture.whenStable();
    expect(bouton().getAttribute('aria-label')).toBe('Ordre décroissant, inverser');
    expect(bouton().textContent?.trim()).toBe('arrow_downward');
  });
});
