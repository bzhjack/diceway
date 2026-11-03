import {describe, expect, it} from 'vitest';
import {extractApiErrorMessage, extractApiErrors, extractApiErrorText} from './api-error.utils';

describe('extractApiErrors', () => {
  it('returns the fallback when the error has no payload', () => {
    expect(extractApiErrors(null, 'fallback')).toEqual(['fallback']);
    expect(extractApiErrors('boom', 'fallback')).toEqual(['fallback']);
    expect(extractApiErrors(undefined, 'fallback')).toEqual(['fallback']);
  });

  it('returns all validation messages when the payload has errors{}', () => {
    const error = {
      error: {
        message: 'The given data was invalid.',
        errors: {nom: ['Le nom est requis.'], email: ['Email invalide.']},
      },
    };

    expect(extractApiErrors(error)).toEqual(['Le nom est requis.', 'Email invalide.']);
  });

  it('falls back to the error field, then message', () => {
    expect(extractApiErrors({error: {error: 'Interdit.'}})).toEqual(['Interdit.']);
    expect(extractApiErrors({error: {message: 'Introuvable.'}})).toEqual(['Introuvable.']);
  });

  it('reads a payload passed directly (without HttpErrorResponse wrapper)', () => {
    expect(extractApiErrors({message: 'Direct.'})).toEqual(['Direct.']);
  });
});

describe('extractApiErrorMessage', () => {
  it('returns the first message', () => {
    const error = {error: {errors: {nom: ['Premier.', 'Second.']}}};
    expect(extractApiErrorMessage(error, 'fallback')).toBe('Premier.');
  });

  it('returns the fallback for unknown errors', () => {
    expect(extractApiErrorMessage(42, 'fallback')).toBe('fallback');
    expect(extractApiErrorMessage({error: {}}, 'fallback')).toBe('fallback');
  });
});

describe('extractApiErrorText', () => {
  it('joins every validation message, so that no reason is hidden', () => {
    const error = {error: {errors: {attributs: ['La somme des attributs ne peut pas dépasser 4.'], combat: ['Une seule aptitude de combat peut être négative.']}}};
    expect(extractApiErrorText(error, 'fallback')).toBe('La somme des attributs ne peut pas dépasser 4. Une seule aptitude de combat peut être négative.');
  });

  it('returns the fallback for unknown errors', () => {
    expect(extractApiErrorText(42, 'fallback')).toBe('fallback');
  });
});
