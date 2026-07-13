import {Signal, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {Observable, startWith, switchMap} from 'rxjs';

export interface RefreshableResource<T> {
  readonly data: Signal<T[]>;
  refresh(): void;
}

/**
 * Liste chargée depuis l'API avec rechargement à la demande (après une suppression, etc.).
 * Doit être créé dans un contexte d'injection (initialiseur de champ).
 */
export function refreshableResource<T>(load: () => Observable<T[]>): RefreshableResource<T> {
  const trigger = signal(0);
  const data = toSignal(
    toObservable(trigger).pipe(
      startWith(0),
      switchMap(() => load()),
    ),
    {initialValue: [] as T[]},
  );

  return {
    data,
    refresh: () => trigger.update((value) => value + 1),
  };
}
