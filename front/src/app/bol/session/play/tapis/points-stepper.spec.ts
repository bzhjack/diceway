import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TapisKind} from '../../models/tapis.model';
import {PointsStepperComponent} from './points-stepper';

describe('PointsStepperComponent', () => {
  let fixture: ComponentFixture<PointsStepperComponent>;
  const pas: number[] = [];

  async function rendre(kind: TapisKind, points: number): Promise<HTMLElement> {
    pas.length = 0;
    fixture = TestBed.createComponent(PointsStepperComponent);
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('points', points);
    fixture.componentRef.setInput('nom', 'Grimar');
    fixture.componentInstance.stepped.subscribe((delta) => pas.push(delta));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const bouton = (element: HTMLElement, label: string): HTMLButtonElement => element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;

  it('montre l’héroïsme d’un héros en gemmes, allumées jusqu’aux points restants', async () => {
    const element = await rendre('hero', 3);
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('3 points d’héroïsme');
    expect(element.querySelectorAll('.pst-gemme').length).toBe(5);
    expect(element.querySelectorAll('.pst-gemme--on').length).toBe(3);
    expect(element.classList).not.toContain('pst--vilenie');
  });

  it('retire et ajoute un point', async () => {
    const element = await rendre('hero', 3);
    bouton(element, 'Retirer 1 point d’héroïsme à Grimar').click();
    bouton(element, 'Ajouter 1 point d’héroïsme à Grimar').click();
    expect(pas).toEqual([-1, 1]);
  });

  it('à 0 point, − est grisé et ne retire rien', async () => {
    const element = await rendre('hero', 0);
    const moins = bouton(element, 'Retirer 1 point d’héroïsme à Grimar');
    expect(moins.getAttribute('aria-disabled')).toBe('true');
    moins.click();
    expect(pas).toEqual([]);
  });

  it('parle de vilénie pour un rival, en gemmes rouges', async () => {
    const element = await rendre('pnj', 2);
    expect(element.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('2 points de vilénie');
    expect(element.classList).toContain('pst--vilenie');
    bouton(element, 'Ajouter 1 point de vilénie à Grimar').click();
    expect(pas).toEqual([1]);
  });
});
