import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {CarteDialogComponent} from './carte-dialog';

describe('CarteDialogComponent', () => {
  let fixture: ComponentFixture<CarteDialogComponent>;

  async function rendre(): Promise<HTMLElement> {
    TestBed.configureTestingModule({providers: [{provide: MAT_DIALOG_DATA, useValue: {lieu: 'Gué du Tyr, Jungle de Qush', point: {x: 26.4, y: 59}}}]});
    fixture = TestBed.createComponent(CarteDialogComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('montre la carte HD et repère la région de la scène', async () => {
    const element = await rendre();
    const carte = element.querySelector<HTMLImageElement>('img.crt-image')!;
    expect(carte.getAttribute('src')).toContain('/assets/bol/cartes/carte-hd.jpg');
    expect(carte.alt).toBe('Carte de Lémurie, où un cercle marque le lieu de la scène : Gué du Tyr, Jungle de Qush');
    const repere = element.querySelector<HTMLElement>('.crt-repere')!;
    expect(parseFloat(repere.style.left)).toBeCloseTo(28.459, 2);
    expect(parseFloat(repere.style.top)).toBeCloseTo(56.789, 2);
  });

  it('s’ouvre en taille réelle, sans bouton pour agrandir', async () => {
    const element = await rendre();
    expect(element.querySelector('button.crt-zoom')).toBeNull();
    expect(element.textContent).not.toContain('Agrandir');
  });
});
