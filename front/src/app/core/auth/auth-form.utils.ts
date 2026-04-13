import { AbstractControl, ValidationErrors } from '@angular/forms';

interface ErrorPayload {
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readPayload(error: unknown): ErrorPayload | null {
  if (!isObject(error)) {
    return null;
  }

  const candidate = 'error' in error ? error['error'] : error;
  if (!isObject(candidate)) {
    return null;
  }

  return candidate as ErrorPayload;
}

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('password_confirmation')?.value;

  if (!password || !confirmation) {
    return null;
  }

  return password === confirmation ? null : { passwordMismatch: true };
}

export function extractApiErrors(
  error: unknown,
  fallback = 'Une erreur est survenue.',
): string[] {
  const payload = readPayload(error);
  if (!payload) {
    return [fallback];
  }

  const validationMessages = payload.errors
    ? Object.values(payload.errors).flat().filter(Boolean)
    : [];

  if (validationMessages.length > 0) {
    return validationMessages;
  }

  if (payload.error) {
    return [payload.error];
  }

  if (payload.message) {
    return [payload.message];
  }

  return [fallback];
}
