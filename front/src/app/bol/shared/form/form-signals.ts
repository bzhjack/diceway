import {Signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormControl, FormGroup, PristineChangeEvent} from '@angular/forms';
import {filter, map, startWith} from 'rxjs';

/** Signal suivant la valeur courante d'un contrôle (doit être appelé dans un contexte d'injection). */
export function controlValueSignal<T>(control: FormControl<T>): Signal<T> {
  return toSignal(control.valueChanges.pipe(startWith(control.value)), {initialValue: control.value});
}

/** Signal indiquant si le formulaire a des modifications non enregistrées. */
export function formDirtySignal(form: FormGroup): Signal<boolean> {
  return toSignal(
    form.events.pipe(
      filter((event): event is PristineChangeEvent => event instanceof PristineChangeEvent),
      map((event) => !event.pristine),
    ),
    {initialValue: false},
  );
}

/** Signal suivant la valeur brute d'un FormArray (brouillon de sélection). */
export function formArrayValueSignal<TDraft>(array: FormArray): Signal<readonly TDraft[]> {
  return toSignal(
    array.valueChanges.pipe(
      startWith(array.getRawValue()),
      map((value) => value as TDraft[]),
    ),
    {initialValue: array.getRawValue() as TDraft[]},
  );
}
