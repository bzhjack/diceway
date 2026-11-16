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
    return {el, ligne, close, fixture};
  }

  const REGIONS = [
    {id: 14, region: 'Satarla'},
    {id: 6, region: 'Lysor'},
    {id: 99, region: 'Ailleurs'},
  ];

  it('montre la carte avec les régions, la choisie marquée', async () => {
    const {el} = await rendre({regions: REGIONS, regionId: 6});

    expect(el.querySelectorAll('bol-region-carte .rca-point')).toHaveLength(2);
    expect(el.querySelector('.rca-point--choisi')?.getAttribute('aria-label')).toBe('Choisir la région Lysor');
  });

  it('survoler une ligne allume son point', async () => {
    const {el, ligne, fixture} = await rendre({regions: REGIONS, regionId: null});

    ligne('Satarla').dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();

    expect(el.querySelector('.rca-point--survole')?.getAttribute('aria-label')).toBe('Choisir la région Satarla');
  });

  it('liste « Aucune » puis les régions, la choisie marquée', async () => {
    const {el, ligne} = await rendre({regions: REGIONS, regionId: 6});

    expect([...el.querySelectorAll('.rcd-ligne')].map((b) => b.textContent?.trim())).toEqual(['Aucune', 'Satarla', 'Lysor', 'Ailleurs']);
    expect(ligne('Lysor').getAttribute('aria-pressed')).toBe('true');
    expect(ligne('Aucune').getAttribute('aria-pressed')).toBe('false');
  });

  it('un clic sur un point ou une ligne choisit et ferme ; « Aucune » rend null', async () => {
    const {el, ligne, close} = await rendre({regions: REGIONS, regionId: null});

    el.querySelector<HTMLButtonElement>('.rca-point')!.click();
    expect(close).toHaveBeenLastCalledWith(14);
    ligne('Lysor').click();
    expect(close).toHaveBeenLastCalledWith(6);
    ligne('Aucune').click();
    expect(close).toHaveBeenLastCalledWith(null);
  });

  it('« Annuler » ferme sans rien rendre : la région reste ce qu’elle était', async () => {
    const {el, close} = await rendre({regions: REGIONS, regionId: 6});

    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === 'Annuler')!.click();

    expect(close).toHaveBeenCalledTimes(1);
    expect(close.mock.calls[0]).toEqual([]);
  });
});
