import {Location} from '@angular/common';
import {Signal, WritableSignal, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Field, FieldTree} from '@angular/forms/signals';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {HasPendingChanges} from '../../../core/pending-changes.guard';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
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
 * La sous-classe fournit le formulaire (Signal Forms), les libellés et les opérations
 * spécifiques (chargement, hydratation, payload, création/mise à jour).
 */
export abstract class BolEntityFormPageBase<TEntity, TFormModel extends {avatar: string | null}>
  implements HasPendingChanges
{
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
  protected abstract readonly model: WritableSignal<TFormModel>;
  protected abstract readonly entityForm: FieldTree<TFormModel>;

  protected abstract loadEntity(id: string): Observable<TEntity>;
  protected abstract createEntity(payload: Record<string, unknown>): Observable<TEntity>;
  protected abstract updateEntity(payload: Record<string, unknown>): Observable<TEntity>;
  protected abstract buildPayload(): Record<string, unknown>;
  protected abstract hydrateForm(entity: TEntity): void;
  protected abstract resetForm(): void;

  protected readonly formDirty = computed(() => this.entityForm().dirty());

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
  protected performSave(payload: Record<string, unknown>, onSaved: (entity: TEntity) => void): void {
    if (this.pending() || this.loading()) {
      return;
    }

    if (this.entityForm().invalid()) {
      this.entityForm().markAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);

    const action$ = this.editMode() ? this.updateEntity(payload) : this.createEntity(payload);

    action$
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: (entity) => {
          this.entityForm().reset();
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

  protected fieldError(field: Field<unknown>): boolean {
    const state = field();
    return state.invalid() && (state.dirty() || state.touched());
  }

  canLeave(): boolean | Observable<boolean> {
    if (!this.formDirty()) {
      return true;
    }

    return confirmDialog(this.dialog, {
      title: 'Modifications non enregistrées',
      message: this.labels.unsavedChanges,
      confirmLabel: 'Quitter sans sauver',
      cancelLabel: 'Annuler',
    });
  }

  protected pickAvatar(): void {
    const ref = this.dialog.open(PictureComponent, {
      data: {title: this.labels.avatarDialogTitle},
      width: 'min(960px, 92vw)',
      disableClose: true,
    });

    ref.afterClosed().pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        this.entityForm.avatar().value.set(avatar);
        this.entityForm.avatar().markAsDirty();
      }
    });
  }

  /**
   * Applique les stats par défaut d'une référence (taille de créature, catégorie de démon)
   * quand elle change, sauf juste après hydratation (hydratedReferenceId).
   * À appeler dans le constructeur de la sous-classe.
   */
  protected setupReferenceDefaults<R>(
    selected: Signal<R | undefined>,
    referenceId: (reference: R) => number,
    patch: (reference: R) => Partial<TFormModel>,
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

      this.model.update((current) => ({...current, ...patch(reference)}));
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
