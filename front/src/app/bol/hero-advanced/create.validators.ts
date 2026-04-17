import {AbstractControl, FormArray, ValidationErrors, ValidatorFn} from '@angular/forms';

export const globalFormValidator: ValidatorFn = (_control: AbstractControl): ValidationErrors | null => {
  return null;
};

export const attributValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return {required: {value: control.value}};
  }

  if (Number.isNaN(Number(value))) {
    return {numeric: {value: control.value}};
  }

  if (value < -1) {
    return {tooSmallAttr: {value: control.value}};
  }

  if (value > 3) {
    return {tooBigAttr: {value: control.value}};
  }

  return null;
};

export const carriereValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === undefined || value === '') {
    return {required: {value: control.value}};
  }

  if (Number.isNaN(Number(value))) {
    return {numeric: {value: control.value}};
  }

  if (value < 0) {
    return {tooSmallAttr: {value: control.value}};
  }

  if (value > 3) {
    return {tooBigAttr: {value: control.value}};
  }

  return null;
};

export const combatFormValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const controlIds = ['tir', 'melee', 'defense', 'initiative'];
  const values = controlIds.map((id) => Number(control.get(id)?.value ?? 0));
  let errors: ValidationErrors = {};

  if (values.filter((value) => value === -1).length > 1) {
    errors = {...errors, aptTooManyNegative: true};
  }

  if (values.reduce((sum, value) => sum + value, 0) > 4) {
    errors = {...errors, aptSumExceeded: true};
  }

  return Object.keys(errors).length ? errors : null;
};

export const attributsFormValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const controlIds = ['vigueur', 'agilite', 'aura', 'esprit'];
  const values = controlIds.map((id) => Number(control.get(id)?.value ?? 0));
  let errors: ValidationErrors = {};

  if (values.filter((value) => value === -1).length > 1) {
    errors = {...errors, attrTooManyNegative: true};
  }

  if (values.reduce((sum, value) => sum + value, 0) > 4) {
    errors = {...errors, attrSumExceeded: true};
  }

  return Object.keys(errors).length ? errors : null;
};

export const carrieresFormValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const carrieres = control.get('carrieres') as FormArray | null;
  if (!carrieres) {
    return null;
  }

  const sum = carrieres.controls.reduce((total, current) => total + Number(current.get('value')?.value ?? 0), 0);
  return sum > 4 ? {carrSumExceeded: true} : null;
};
