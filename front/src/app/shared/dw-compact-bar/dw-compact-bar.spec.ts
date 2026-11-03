import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {DwCompactBarComponent} from './dw-compact-bar';

@Component({
  imports: [DwCompactBarComponent],
  template: `<dw-compact-bar [watch]="entete()" titre="Création avancée · Axel"><button type="button">Enregistrer</button></dw-compact-bar>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HoteComponent {
  readonly entete = signal<HTMLElement | null>(null);
}

describe('DwCompactBarComponent', () => {
  it('reste cachée et inerte tant que l’en-tête n’est pas sorti de l’écran, avec son titre et ses boutons', async () => {
    const fixture = TestBed.createComponent(HoteComponent);
    await fixture.whenStable();
    const barre = (fixture.nativeElement as HTMLElement).querySelector('.dw-cb')!;

    expect(barre.classList).not.toContain('dw-cb--visible');
    expect(barre.hasAttribute('inert')).toBe(true);
    expect(barre.querySelector('.dw-cb-titre')?.textContent).toBe('Création avancée · Axel');
    expect(barre.querySelector('.dw-cb-actions button')?.textContent).toBe('Enregistrer');
  });
});
