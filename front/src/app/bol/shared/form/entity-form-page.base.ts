import {Location} from '@angular/common';
import {Signal, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, map, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {HasPendingChanges} from '../../../core/pending-changes.guard';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {PictureComponent} from '../../../shared/picture/picture';

/** Libellés spécifiques à l'entité pour les textes communs des pages de formulaire. */
export interface EntityFormLabels {
  createTitle: string;
  editTitle: string;
  createEyebrow: string;
  editEyebrow: string;
  createSubmitLabel: string;
  editSubmitLabel: string;
  loadError: string;
  createError: string;
  updateError: string;
  unsavedChanges: string;
  avatarDialogTitle: string;
}

/**
 * Socle commun des pages de formulaire d'entité (héros, PNJ, créature, démon) :
 * chargement par paramètre de route, cycle de sauvegarde, navigation retour,
 * garde "modifications non enregistrées", raccourci Ctrl+S et sélection d'avatar.
 *
 * La sous-classe fournit le formulaire, les libellés et les opérations spécifiques
 * (chargement, hydratation, payload, création/mise à jour).
 */
export abstract class BolEntityFormPageBase<T> implements HasPendingChanges {
  protected readonly formBuilder = inject(FormBuilder);
  protected readonly route = inject(ActivatedRoute);
  protected readonly location = inject(Location);
  protected readonly router = inject(Router);
  protected readonly dialog = inject(MatDialog);

  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly loading = signal(false);
  protected readonly returnUrl = signal<string | null>(this.readReturnUrl());
  protected readonly entityId = computed(() => this.routeParamMap().get('id'));
  protected readonly editMode = computed(() => Boolean(this.entityId()));
  protected readonly pageTitle = computed(() =>
    this.editMode() ? this.labels.editTitle : this.labels.createTitle,
  );
  protected readonly pageEyebrow = computed(() =>
    this.editMode() ? this.labels.editEyebrow : this.labels.createEyebrow,
  );
  protected readonly submitLabel = computed(() => {
    if (this.pending()) {
      return 'Enregistrement...';
    }

    return this.editMode() ? this.labels.editSubmitLabel : this.labels.createSubmitLabel;
  });

  protected readonly compareById = (a: number | string | null, b: number | string | null): boolean =>
    Number(a) === Number(b);

  /** Id de référence posé à l'hydratation pour ne pas réécraser les stats via les défauts (cf. setupReferenceDefaults). */
  protected hydratedReferenceId: number | null = null;

  protected abstract readonly labels: EntityFormLabels;
  protected abstract readonly entityForm: FormGroup;
  protected abstract readonly formDirty: Signal<boolean>;

  protected abstract loadEntity(id: string): Observable<T>;
  protected abstract createEntity(payload: Record<string, unknown>): Observable<T>;
  protected abstract updateEntity(payload: Record<string, unknown>): Observable<T>;
  protected abstract buildPayload(): Record<string, unknown>;
  protected abstract hydrateForm(entity: T): void;
  protected abstract resetForm(): void;

  constructor() {
    effect((onCleanup) => {
      const entityId = this.entityId();
      this.returnUrl.set(this.readReturnUrl());
      this.errorMessage.set(null);

      if (!entityId) {
        this.resetForm();
        return;
      }

      this.loading.set(true);
      const subscription = this.loadEntity(entityId)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (entity) => this.hydrateForm(entity),
          error: (error: unknown) => {
            this.errorMessage.set(extractApiErrorMessage(error, this.labels.loadError));
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected save(): void {
    this.performSave(this.buildPayload(), () => this.navigateBack(true));
  }

  /** Cycle de sauvegarde commun : gardes, appel create/update selon le mode, erreurs. */
  protected performSave(payload: Record<string, unknown>, onSaved: (entity: T) => void): void {
    if (this.pending() || this.loading()) {
      return;
    }

    if (this.entityForm.invalid) {
      this.entityForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);

    const action$ = this.editMode() ? this.updateEntity(payload) : this.createEntity(payload);

    action$
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (entity) => {
          this.entityForm.markAsPristine();
          onSaved(entity);
        },
        error: (error: unknown) => {
          this.errorMessage.set(
            extractApiErrorMessage(error, this.editMode() ? this.labels.updateError : this.labels.createError),
          );
        },
      });
  }

  protected goBack(): void {
    this.navigateBack(false);
  }

  protected onSaveShortcut(event: Event): void {
    event.preventDefault();
    this.save();
  }

  protected onError(controlName: string): boolean {
    const control = this.entityForm.get(controlName);
    return Boolean(control && control.invalid && (control.dirty || control.touched));
  }

  canLeave(): boolean | Observable<boolean> {
    if (!this.formDirty()) {
      return true;
    }

    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Modifications non enregistrées',
        message: this.labels.unsavedChanges,
        confirmLabel: 'Quitter sans sauver',
        cancelLabel: 'Annuler',
      },
    });

    return ref.afterClosed().pipe(map((confirmed: boolean | undefined) => Boolean(confirmed)));
  }

  protected pickAvatar(): void {
    const ref = this.dialog.open(PictureComponent, {
      data: {title: this.labels.avatarDialogTitle},
      width: 'min(960px, 92vw)',
      disableClose: true,
    });

    ref.afterClosed().pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        const control = this.entityForm.get('avatar');
        control?.setValue(avatar);
        control?.markAsDirty();
      }
    });
  }

  /** Ajoute une entrée {id} à un FormArray de sélection. */
  protected addIdEntry(array: FormArray, id: number): void {
    array.push(this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}));
    array.markAsDirty();
  }

  protected removeItem(items: FormArray, index: number): void {
    items.removeAt(index);
    items.markAsDirty();
  }

  /** Hydratation : pousse des groupes {id} sans émettre d'événements. */
  protected pushIdGroups(array: FormArray, ids: readonly (number | string)[]): void {
    for (const id of ids) {
      array.push(
        this.formBuilder.group({id: this.formBuilder.control(Number(id), Validators.required)}),
        {emitEvent: false},
      );
    }
  }

  /** Resynchronise les FormArray de sélection après un reset/hydratation silencieux. */
  protected syncArrays(...arrays: FormArray[]): void {
    for (const array of arrays) {
      array.updateValueAndValidity({emitEvent: true});
    }
  }

  /**
   * Applique les stats par défaut d'une référence (taille de créature, catégorie de démon)
   * quand elle change, sauf juste après hydratation (hydratedReferenceId).
   * À appeler dans le constructeur de la sous-classe.
   */
  protected setupReferenceDefaults<R>(
    selected: Signal<R | undefined>,
    referenceId: (reference: R) => number,
    patch: (reference: R) => Record<string, unknown>,
  ): void {
    effect(() => {
      const reference = selected();
      if (!reference) {
        return;
      }

      if (this.hydratedReferenceId !== null && referenceId(reference) === this.hydratedReferenceId) {
        this.hydratedReferenceId = null;
        return;
      }

      this.entityForm.patchValue(patch(reference), {emitEvent: false});
    });
  }

  protected navigateBack(afterSave: boolean): void {
    const returnUrl = this.returnUrl();
    if (returnUrl) {
      void this.router.navigateByUrl(returnUrl);
      return;
    }

    if (!afterSave && typeof history !== 'undefined' && history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/');
  }

  private readReturnUrl(): string | null {
    if (typeof history === 'undefined') {
      return null;
    }

    const state = history.state as Record<string, unknown> | null;
    return typeof state?.['returnUrl'] === 'string' ? state['returnUrl'] : null;
  }
}
