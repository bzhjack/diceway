import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {form, FormField, max, min} from '@angular/forms/signals';
import {DwValueStepperComponent} from './value-stepper';

@Component({
  imports: [DwValueStepperComponent],
  template: `<dw-value-stepper [value]="value()" [min]="0" [max]="3" (valueChange)="changes.push($event)" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AloneHostComponent {
  readonly value = signal(2);
  readonly changes: number[] = [];
}

@Component({
  imports: [DwValueStepperComponent, FormField],
  template: `<dw-value-stepper [formField]="field" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FormHostComponent {
  readonly model = signal(1);
  readonly field = form(this.model, (path) => {
    min(path, 0);
    max(path, 2);
  });
}

describe('DwValueStepperComponent', () => {
  const buttons = (root: HTMLElement) => [...root.querySelectorAll<HTMLButtonElement>('.vs__btn')];
  const input = (root: HTMLElement) => root.querySelector<HTMLInputElement>('input')!;

  it('signale chaque pas, et s\'arrête à ses bornes', async () => {
    const fixture = TestBed.createComponent(AloneHostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const [moins, plus] = buttons(root);

    plus.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.changes).toEqual([3]);
    expect(input(root).value).toBe('3');
    expect(plus.disabled).toBe(true);
    expect(moins.disabled).toBe(false);
  });

  it('borne ce qui est tapé', async () => {
    const fixture = TestBed.createComponent(AloneHostComponent);
    await fixture.whenStable();
    const champ = input(fixture.nativeElement as HTMLElement);

    champ.value = '50';
    champ.dispatchEvent(new Event('change'));

    expect(fixture.componentInstance.changes).toEqual([3]);
  });

  it('suit sa valeur quand la page la change', async () => {
    const fixture = TestBed.createComponent(AloneHostComponent);
    await fixture.whenStable();

    fixture.componentInstance.value.set(1);
    await fixture.whenStable();

    expect(input(fixture.nativeElement as HTMLElement).value).toBe('1');
    expect(fixture.componentInstance.changes).toEqual([]);
  });

  it('écrit dans le champ du formulaire, marque le champ et prend ses bornes du schéma', async () => {
    const fixture = TestBed.createComponent(FormHostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const [, plus] = buttons(root);
    const host = fixture.componentInstance;

    expect(input(root).value).toBe('1');
    plus.click();
    await fixture.whenStable();

    expect(host.model()).toBe(2);
    expect(host.field().dirty()).toBe(true);
    expect(host.field().touched()).toBe(true);
    expect(plus.disabled).toBe(true);

    host.model.set(0);
    await fixture.whenStable();
    expect(input(root).value).toBe('0');
  });
});
