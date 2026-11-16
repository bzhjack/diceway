import {TestBed} from '@angular/core/testing';
import {RegionCarteChoix} from '../models/region-carte.model';
import {RegionCarteComponent} from './region-carte';

describe('RegionCarteComponent', () => {
  const REGIONS: RegionCarteChoix[] = [
    {id: 14, region: 'Satarla'},
    {id: 6, region: 'Lysor'},
    {id: 99, region: 'Ailleurs'},
  ];

  async function rendre(choisie: number | null, survolee: number | null = null) {
    const fixture = TestBed.createComponent(RegionCarteComponent);
    fixture.componentRef.setInput('regions', REGIONS);
    fixture.componentRef.setInput('choisie', choisie);
    fixture.componentRef.setInput('survolee', survolee);
    const choix: number[] = [];
    const survols: (number | null)[] = [];
    fixture.componentInstance.choisir.subscribe((id) => choix.push(id));
    fixture.componentInstance.survol.subscribe((id) => survols.push(id));
    await fixture.whenStable();
    const points = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.rca-point')];
    return {points, choix, survols};
  }

  it('place un point par région connue de la carte, hors de la tabulation, nommé', async () => {
    const {points} = await rendre(null);

    expect(points).toHaveLength(2);
    expect(points[0].style.left).toBe('35.2%');
    expect(points[0].style.top).toBe('64.3%');
    expect(points[0].getAttribute('aria-label')).toBe('Choisir la région Satarla');
    expect(points[0].tabIndex).toBe(-1);
    expect(points[0].closest('[aria-hidden="true"]')).toBeNull();
  });

  it('la région choisie en rouge, la survolée allumée', async () => {
    const {points} = await rendre(6, 14);

    expect(points[1].classList).toContain('rca-point--choisi');
    expect(points[0].classList).toContain('rca-point--survole');
    expect(points[0].classList).not.toContain('rca-point--choisi');
  });

  it('un clic dit la région, le survol aussi', async () => {
    const {points, choix, survols} = await rendre(null);

    points[1].click();
    points[0].dispatchEvent(new MouseEvent('mouseenter'));
    points[0].dispatchEvent(new MouseEvent('mouseleave'));

    expect(choix).toEqual([6]);
    expect(survols).toEqual([14, null]);
  });
});
