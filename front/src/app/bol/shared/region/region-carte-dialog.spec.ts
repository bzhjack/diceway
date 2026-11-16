import {TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {RegionCarteDialogData} from '../models/region-carte-dialog.model';
import {RegionCarteDialogComponent} from './region-carte-dialog';

describe('RegionCarteDialogComponent', () => {
  async function rendre(data: RegionCarteDialogData) {
    const close = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        {provide: MAT_DIALOG_DATA, useValue: data},
        {provide: MatDialogRef, useValue: {close}},
      ],
    });
    const fixture = TestBed.createComponent(RegionCarteDialogComponent);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const ligne = (nom: string) => [...el.querySelectorAll<HTMLButtonElement>('.rcd-ligne')].find((b) => b.textContent?.trim() === nom)!;
    return {el, ligne, close};
  }

  const REGIONS = [
    {id: 14, region: 'Satarla'},
    {id: 6, region: 'Lysor'},
    {id: 99, region: 'Ailleurs'},
  ];

  it('place un point par région connue de la carte, la région choisie en rouge', async () => {
    const {el} = await rendre({regions: REGIONS, regionId: 6});

    const points = [...el.querySelectorAll<HTMLElement>('.rcd-point')];
    expect(points).toHaveLength(2);
    expect(points[0].style.left).toBe('35.2%');
    expect(points[0].style.top).toBe('64.3%');
    expect(points[1].classList).toContain('rcd-point--choisi');
  });

  it('liste « Aucune » puis les régions, la choisie marquée', async () => {
    const {el, ligne} = await rendre({regions: REGIONS, regionId: 6});

    expect([...el.querySelectorAll('.rcd-ligne')].map((b) => b.textContent?.trim())).toEqual(['Aucune', 'Satarla', 'Lysor', 'Ailleurs']);
    expect(ligne('Lysor').getAttribute('aria-pressed')).toBe('true');
    expect(ligne('Aucune').getAttribute('aria-pressed')).toBe('false');
  });

  it('un clic sur un point ou une ligne choisit et ferme ; « Aucune » rend null', async () => {
    const {el, ligne, close} = await rendre({regions: REGIONS, regionId: null});

    el.querySelector<HTMLButtonElement>('.rcd-point')!.click();
    expect(close).toHaveBeenLastCalledWith(14);
    ligne('Lysor').click();
    expect(close).toHaveBeenLastCalledWith(6);
    ligne('Aucune').click();
    expect(close).toHaveBeenLastCalledWith(null);
  });
});
