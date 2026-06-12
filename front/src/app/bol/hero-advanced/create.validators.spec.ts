import {FormBuilder, FormControl} from '@angular/forms';
import {combatFormValidatorFn, carrieresFormValidatorFn} from './create.validators';

describe('combatFormValidatorFn', () => {
  const fb = new FormBuilder();

  function makeForm(budget: number, init: number, melee: number, tir: number, defense: number) {
    return fb.group(
      {initiative: [init], melee: [melee], tir: [tir], defense: [defense]},
      {validators: combatFormValidatorFn(budget)},
    );
  }

  it('passes when sum equals budget (4)', () => {
    const form = makeForm(4, 2, 1, 0, 1);
    expect(form.errors).toBeNull();
  });

  it('fails when sum exceeds budget (4)', () => {
    const form = makeForm(4, 2, 1, 1, 1);
    expect(form.errors?.['aptSumExceeded']).toBe(true);
  });

  it('non-combattant: passes with sum=2 and budget=2', () => {
    const form = makeForm(2, 1, 0, 0, 1);
    expect(form.errors).toBeNull();
  });

  it('non-combattant: fails when sum exceeds budget=2', () => {
    const form = makeForm(2, 2, 1, 0, 0);
    expect(form.errors?.['aptSumExceeded']).toBe(true);
  });

  it('fails when more than one aptitude is -1', () => {
    const form = makeForm(4, -1, -1, 0, 0);
    expect(form.errors?.['aptTooManyNegative']).toBe(true);
  });
});

describe('carrieresFormValidatorFn', () => {
  const fb = new FormBuilder();

  function makeForm(budget: number, values: number[]) {
    const carrieres = fb.array(values.map((v) => fb.group({carriere_id: [1], value: [v]})));
    return fb.group({carrieres}, {validators: carrieresFormValidatorFn(budget)});
  }

  it('passes when sum equals budget (4)', () => {
    const form = makeForm(4, [1, 1, 1, 1]);
    expect(form.errors).toBeNull();
  });

  it('fails when sum exceeds budget (4)', () => {
    const form = makeForm(4, [2, 2, 1, 0]);
    expect(form.errors?.['carrSumExceeded']).toBe(true);
  });

  it('non-combattant: passes with sum=6 and budget=6', () => {
    const form = makeForm(6, [3, 2, 1, 0]);
    expect(form.errors).toBeNull();
  });

  it('non-combattant: fails when sum exceeds budget=6', () => {
    const form = makeForm(6, [3, 2, 1, 1]);
    expect(form.errors?.['carrSumExceeded']).toBe(true);
  });

  it('sorcier rang 3: passes sum=3 with budget=4', () => {
    // Sorcier rang 3 means 2 extra désavantages needed (via carriereDesavangeCount),
    // but the carrier budget validator itself is independent — just verify sum <= budget
    const form = makeForm(4, [3, 0, 0, 0]);
    expect(form.errors).toBeNull();
  });

  it('alchimiste rang 3: passes sum=3 with budget=4', () => {
    const form = makeForm(4, [3, 0, 0, 0]);
    expect(form.errors).toBeNull();
  });
});
