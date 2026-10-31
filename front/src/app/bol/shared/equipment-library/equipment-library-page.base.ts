import {computed, inject, signal, WritableSignal} from '@angular/core';
import {Field, FieldTree} from '@angular/forms/signals';
import {MatDialog} from '@angular/material/dialog';
import {Observable} from 'rxjs';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {RefreshableResource} from '../../../shared/models/refreshable-resource.model';
import {EquipmentLibraryTexts} from '../models/equipment-library.model';

/**
 * Socle des catalogues d'équipement (armes, armures) : recherche, compteurs et cycle du formulaire d'une entrée. Une entrée du catalogue public ne se
 * modifie pas : seules les créations du compte portent `user_id`.
 */
export abstract class BolEquipmentLibraryPageBase<TItem extends {id: number | null; user_id?: string | null}, TDraft> {
  private readonly dialog = inject(MatDialog);

  protected readonly searchTerm = signal('');
  protected readonly onlyCreations = signal(false);
  protected readonly formVisible = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');

  protected abstract readonly items: RefreshableResource<TItem>;
  protected abstract readonly model: WritableSignal<TDraft>;
  protected abstract readonly itemForm: FieldTree<TDraft>;
  protected abstract readonly texts: EquipmentLibraryTexts<TItem>;

  protected abstract emptyDraft(): TDraft;
  protected abstract draftOf(item: TItem): TDraft;
  protected abstract payloadOf(draft: TDraft, id: number | null): TItem;
  protected abstract createItem(payload: TItem): Observable<unknown>;
  protected abstract updateItem(payload: TItem): Observable<unknown>;
  protected abstract deleteItem(id: number): Observable<unknown>;

  protected readonly totalCount = computed(() => this.items.data().length);
  protected readonly customCount = computed(() => this.items.data().filter((item) => Boolean(item.user_id)).length);
  protected readonly canonicalCount = computed(() => this.items.data().filter((item) => !item.user_id).length);
  protected readonly formTitle = computed(() => (this.editingId() ? this.texts.editTitle : this.texts.newTitle));
  protected readonly submitLabel = computed(() => (this.editingId() ? 'Enregistrer' : 'Créer'));

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.onlyCreations.set(false);
  }

  protected startCreate(): void {
    this.open(null, this.emptyDraft());
  }

  protected startEdit(item: TItem): void {
    if (this.canManage(item)) {
      this.open(item.id, this.draftOf(item));
    }
  }

  protected cancelForm(): void {
    this.formVisible.set(false);
    this.editingId.set(null);
    this.errorMessage.set('');
    this.fill(this.emptyDraft());
  }

  protected submitForm(): void {
    if (this.submitting()) {
      return;
    }

    if (this.itemForm().invalid()) {
      this.itemForm().markAsTouched();
      return;
    }

    const payload = this.payloadOf(this.model(), this.editingId());
    this.submitting.set(true);
    this.errorMessage.set('');

    (this.editingId() ? this.updateItem(payload) : this.createItem(payload)).subscribe({
      next: () => {
        this.submitting.set(false);
        this.items.refresh();
        this.cancelForm();
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(extractApiErrorMessage(error, this.texts.saveError));
      },
    });
  }

  protected askDelete(item: TItem): void {
    if (!this.canManage(item)) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: this.texts.deleteTitle,
        message: `Supprimer "${this.texts.name(item)}" du catalogue ?`,
        confirmLabel: 'Supprimer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.remove(item);
      }
    });
  }

  protected canManage(item: TItem): boolean {
    return Boolean(item.user_id);
  }

  protected fieldError(field: Field<unknown>): boolean {
    const state = field();
    return state.invalid() && (state.dirty() || state.touched());
  }

  /** Une chaîne saisie, sans espaces autour ; `null` si elle est vide. */
  protected nullableTrimmed(value: string): string | null {
    return value.trim() || null;
  }

  private open(id: number | null, draft: TDraft): void {
    this.editingId.set(id);
    this.formVisible.set(true);
    this.errorMessage.set('');
    this.fill(draft);
  }

  private fill(draft: TDraft): void {
    this.model.set(draft);
    this.itemForm().reset();
  }

  private remove(item: TItem): void {
    if (!item.id) {
      return;
    }

    this.deleteItem(item.id).subscribe({
      next: () => {
        this.items.refresh();

        if (this.editingId() === item.id) {
          this.cancelForm();
        }
      },
      error: (error: unknown) => {
        this.errorMessage.set(extractApiErrorMessage(error, this.texts.deleteError));
      },
    });
  }
}
