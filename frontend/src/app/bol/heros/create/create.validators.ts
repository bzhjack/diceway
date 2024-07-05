import {AbstractControl, ValidationErrors, ValidatorFn} from "@angular/forms";

export const globalFormValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  let errors = {};
  const controlsAttrIds = ['vigueur', 'agilite', 'aura', 'esprit'];
  const controlsAttrArray = controlsAttrIds.map(id => control.get(id));
  const attrs = controlsAttrArray.map(ctrl => ctrl?.value);
  const countNegativeAttr = attrs.filter(value => value === -1).length;
  if (countNegativeAttr > 1) {
    errors = Object.assign(errors, {'attrTooManyNegative': true});
  }
  const sumAttr = attrs.reduce((acc, val) => acc + val, 0);
  if (sumAttr > 4) {
    errors = Object.assign(errors, { 'attrSumExceeded': true });
  }

  const controlsAptIds = ['tir', 'melee', 'defense', 'initiative'];
  const controlsAptArray = controlsAptIds.map(id => control.get(id));
  const apts = controlsAptArray.map(ctrl => ctrl?.value);
  const countNegativeApt = apts.filter(value => value === -1).length;
  if (countNegativeApt > 1) {
    errors = Object.assign(errors, {'aptTooManyNegative': true});
  }
  const sumApt = apts.reduce((acc, val) => acc + val, 0);
  if (sumApt > 4) {
    errors = Object.assign(errors, { 'aptSumExceeded': true });
  }

  return errors;
};

export const attributValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  // Vérifie si la valeur est "falsy" sauf 0 qui est valide
  if (value === null || value === undefined || value === '') {
    return {required: {value: control.value, key: control}};
  }
  // Vérifie si la valeur est un nombre
  const isNumber = !isNaN(Number(value));
  if (!isNumber) {
    return {numeric: {value: control.value}};
  }
  // Vérifie si la valeur est un nombre valide
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
  // Vérifie si la valeur est "falsy" sauf 0 qui est valide
  if (value === null || value === undefined || value === '') {
    return {required: {value: control.value, key: control}};
  }
  // Vérifie si la valeur est un nombre
  const isNumber = !isNaN(Number(value));
  if (!isNumber) {
    return {numeric: {value: control.value}};
  }
  // Vérifie si la valeur est un nombre valide
  if (value < 0) {
    return {tooSmallAttr: {value: control.value}};
  }
  if (value > 3) {
    return {tooBigAttr: {value: control.value}};
  }
  return null;
};

