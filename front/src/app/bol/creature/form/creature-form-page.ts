import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, Signal, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormArray, FormBuilder, FormControl, PristineChangeEvent, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, filter, map, startWith, take} from 'rxjs';
import {finalize} from 'rxjs/operators';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {HasPendingChanges} from '../../../core/pending-changes.guard';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {PictureComponent} from '../../../shared/picture/picture';
import {CapaciteAddEvent, CapaciteAddMenuComponent} from '../../shared/capacite/add-menu/capacite-add-menu.component';
import {CapaciteEntry, CapaciteListComponent} from '../../shared/capacite/list/capacite-list.component';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';

interface CreatureCapaciteDraft {
  id: number;
  detail: string | null;
}

const CREATURE_STAT_GROUPS: readonly StatGroup[] = [
  {
    key: 'attr',
    label: 'Attributs',
    columns: 3,
    cells: [
      {control: 'vigueur', label: 'Vigueur'},
      {control: 'agilite', label: 'Agilité'},
      {control: 'esprit', label: 'Esprit'},
    ],
  },
  {
    key: 'combat',
    label: 'Combat',
    columns: 2,
    cells: [
      {control: 'attaque', label: 'Attaque'},
      {control: 'defense', label: 'Défense'},
    ],
  },
  {
    key: 'res',
    label: 'Ressources',
    columns: 1,
    cells: [{control: 'vitalite', label: 'Vitalité', highlight: true}],
  },
];

@Component({
  selector: 'bol-creature-form-page',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    DwTagComponent,
    CapaciteAddMenuComponent,
    CapaciteListComponent,
    StatsGridComponent,
  ],
  templateUrl: './creature-form-page.html',
  styleUrl: './creature-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureFormPageComponent implements HasPendingChanges {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private hydratedTailleId: number | null = null;

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly capacitesList = this.creatureStateService.capaciteList;
  protected readonly creatureStatGroups = CREATURE_STAT_GROUPS;

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly loadingCreature = signal(false);
  protected readonly returnUrl = signal<string | null>(this.readReturnUrl());
  protected readonly creatureId = computed(() => this.routeParamMap().get('id'));
  protected readonly editMode = computed(() => Boolean(this.creatureId()));
  protected readonly pageTitle = computed(() =>
    this.editMode() ? 'Modifier la créature' : 'Nouvelle créature',
  );
  protected readonly pageEyebrow = computed(() =>
    this.editMode() ? 'Édition bestiaire BOL' : 'Bestiaire BOL',
  );
  protected readonly submitLabel = computed(() => {
    if (this.pending()) {
      return 'Enregistrement...';
    }

    return this.editMode() ? 'Mettre à jour la créature' : 'Enregistrer la créature';
  });

  protected readonly compareById = (a: number | string | null, b: number | string | null): boolean =>
    Number(a) === Number(b);

  protected readonly creatureForm = this.formBuilder.group({
    id: this.formBuilder.control<string | null>(null),
    nom: this.formBuilder.control('', Validators.required),
    id_taille: this.formBuilder.control<number | null>(null, Validators.required),
    commentaire: this.formBuilder.control<string | null>(null),
    vigueur: this.formBuilder.control(0, Validators.required),
    agilite: this.formBuilder.control(0, Validators.required),
    esprit: this.formBuilder.control(0, Validators.required),
    vitalite: this.formBuilder.control(0, Validators.required),
    attaque: this.formBuilder.control(0, Validators.required),
    defense: this.formBuilder.control(0, Validators.required),
    degats: this.formBuilder.control('0', Validators.required),
    protection: this.formBuilder.control('0', Validators.required),
    avatar: this.formBuilder.control<string | null>(null),
    capacites: this.formBuilder.array([]),
  });

  private controlValueSignal<T>(control: FormControl<T>): Signal<T> {
    return toSignal(control.valueChanges.pipe(startWith(control.value)), {initialValue: control.value});
  }

  protected readonly tailleId = this.controlValueSignal(this.creatureForm.controls.id_taille);
  protected readonly avatarPreview = this.controlValueSignal(this.creatureForm.controls.avatar);

  protected readonly formDirty = toSignal(
    this.creatureForm.events.pipe(
      filter((event): event is PristineChangeEvent => event instanceof PristineChangeEvent),
      map((event) => !event.pristine),
    ),
    {initialValue: false},
  );
  protected readonly selectedCapacitesDraft = toSignal(
    this.capacites.valueChanges.pipe(startWith(this.capacites.getRawValue())),
    {initialValue: this.capacites.getRawValue()},
  );
  protected readonly selectedTaille = computed(() =>
    (this.tailles() ?? []).find((taille) => Number(taille.id) === Number(this.tailleId())),
  );
  protected readonly filteredCapacites = computed(() => {
    const selectedIds = new Set(
      (this.selectedCapacitesDraft() ?? []).map((capacite: CreatureCapaciteDraft) => Number(capacite.id)),
    );

    return (this.capacitesList() ?? []).filter((capacite) => !selectedIds.has(Number(capacite.id)));
  });
  protected readonly selectedCapaciteEntries = computed(() =>
    (this.selectedCapacitesDraft() ?? [])
      .map((entry: CreatureCapaciteDraft) => {
        const definition = (this.capacitesList() ?? []).find(
          (capacite) => Number(capacite.id) === Number(entry.id),
        );

        if (!definition) {
          return null;
        }

        return {
          id: Number(entry.id),
          label: definition.capacite,
          description: definition.description || null,
          detail: entry.detail || null,
        };
      })
      .filter((entry: CapaciteEntry | null): entry is CapaciteEntry => entry !== null),
  );

  constructor() {
    effect((onCleanup) => {
      const creatureId = this.creatureId();
      this.returnUrl.set(this.readReturnUrl());
      this.errorMessage.set(null);

      if (!creatureId) {
        this.resetForm();
        return;
      }

      this.loadingCreature.set(true);
      const subscription = this.creaturesService
        .creature(creatureId)
        .pipe(finalize(() => this.loadingCreature.set(false)))
        .subscribe({
          next: (creature) => this.hydrateForm(creature),
          error: (error: unknown) => {
            this.errorMessage.set(this.extractErrorMessage(error, true));
          },
        });

      onCleanup(() => subscription.unsubscribe());
    });

    effect(() => {
      const taille = this.selectedTaille();
      if (!taille) {
        return;
      }

      if (this.hydratedTailleId !== null && Number(taille.id) === this.hydratedTailleId) {
        this.hydratedTailleId = null;
        return;
      }

      this.creatureForm.patchValue(
        {
          vigueur: taille.vigueur ?? 0,
          vitalite: taille.vitalite ?? 0,
          degats: taille.degats ?? '0',
        },
        {emitEvent: false},
      );
    });
  }

  protected get capacites(): FormArray {
    return this.creatureForm.controls.capacites as FormArray;
  }

  protected addCapaciteEntry(event: CapaciteAddEvent): void {
    this.capacites.push(
      this.formBuilder.group({
        id: this.formBuilder.control(event.id, Validators.required),
        detail: this.formBuilder.control(event.detail),
      }),
    );
    this.capacites.markAsDirty();
  }

  protected removeCapacite(index: number): void {
    this.capacites.removeAt(index);
    this.capacites.markAsDirty();
  }

  protected pickAvatar(): void {
    const ref = this.dialog.open(PictureComponent, {
      data: {title: 'Avatar de la créature'},
      width: 'min(960px, 92vw)',
      disableClose: true,
    });

    ref.afterClosed().pipe(take(1)).subscribe((avatar: string | null) => {
      if (avatar) {
        this.creatureForm.controls.avatar.setValue(avatar);
        this.creatureForm.controls.avatar.markAsDirty();
      }
    });
  }

  protected saveCreature(): void {
    if (this.pending() || this.loadingCreature()) {
      return;
    }

    if (this.creatureForm.invalid) {
      this.creatureForm.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.errorMessage.set(null);

    const payload = this.buildCreaturePayload();
    const action$ = this.editMode()
      ? this.creaturesService.updateCreature(payload)
      : this.creaturesService.createCreature(payload);

    action$
      .pipe(finalize(() => this.pending.set(false)))
      .subscribe({
        next: () => {
          this.creatureForm.markAsPristine();
          this.navigateBack(true);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.extractErrorMessage(error, false));
        },
      });
  }

  protected goBack(): void {
    this.navigateBack(false);
  }

  protected onError(controlName: keyof typeof this.creatureForm.controls): boolean {
    const control = this.creatureForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  canLeave(): boolean | Observable<boolean> {
    if (!this.formDirty()) {
      return true;
    }

    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Modifications non enregistrées',
        message: 'Cette créature a des changements non sauvegardés. Quitter sans enregistrer ?',
        confirmLabel: 'Quitter sans sauver',
        cancelLabel: 'Annuler',
      },
    });

    return ref.afterClosed().pipe(map((confirmed: boolean | undefined) => Boolean(confirmed)));
  }

  protected onSaveShortcut(event: Event): void {
    event.preventDefault();
    this.saveCreature();
  }

  private resetForm(): void {
    this.hydratedTailleId = null;
    this.creatureForm.reset(
      {
        id: null,
        nom: '',
        id_taille: null,
        commentaire: null,
        vigueur: 0,
        agilite: 0,
        esprit: 0,
        vitalite: 0,
        attaque: 0,
        defense: 0,
        degats: '0',
        protection: '0',
        avatar: null,
      },
      {emitEvent: false},
    );
    this.capacites.clear({emitEvent: false});
    this.capacites.updateValueAndValidity({emitEvent: true});
  }

  private hydrateForm(creature: BolCreatureModel): void {
    this.hydratedTailleId = Number(creature.id_taille);
    this.capacites.clear({emitEvent: false});

    for (const capacite of creature.capacites) {
      this.capacites.push(
        this.formBuilder.group({
          id: this.formBuilder.control(Number(capacite.capacite_id), Validators.required),
          detail: this.formBuilder.control(capacite.detail || null),
        }),
        {emitEvent: false},
      );
    }

    this.creatureForm.patchValue(
      {
        id: creature.id,
        nom: creature.nom,
        id_taille: Number(creature.id_taille),
        commentaire: creature.commentaire,
        vigueur: creature.vigueur,
        agilite: creature.agilite,
        esprit: creature.esprit,
        vitalite: creature.vitalite,
        attaque: creature.attaque,
        defense: creature.defense,
        degats: creature.degats,
        protection: creature.protection,
        avatar: creature.avatar,
      },
      {emitEvent: true},
    );
    this.capacites.updateValueAndValidity({emitEvent: true});
  }

  private buildCreaturePayload(): Record<string, unknown> {
    const rawValue = this.creatureForm.getRawValue();

    return {
      id: rawValue.id,
      nom: rawValue.nom,
      id_taille: rawValue.id_taille,
      commentaire: rawValue.commentaire,
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      vitalite: rawValue.vitalite,
      attaque: rawValue.attaque,
      defense: rawValue.defense,
      degats: rawValue.degats,
      protection: rawValue.protection,
      avatar: rawValue.avatar,
      capacites: (rawValue.capacites as CreatureCapaciteDraft[]).map((capacite) => ({
        id: capacite.id,
        detail: capacite.detail,
      })),
    };
  }

  private navigateBack(afterSave: boolean): void {
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

  private extractErrorMessage(error: unknown, loading: boolean): string {
    if (typeof error === 'object' && error !== null) {
      if ('error' in error && typeof error.error === 'object' && error.error !== null) {
        const apiError = error.error as Record<string, unknown>;
        if (typeof apiError['message'] === 'string') {
          return apiError['message'];
        }
      }

      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
    }

    return loading
      ? 'Le chargement de la créature a échoué.'
      : this.editMode()
        ? 'La mise à jour de la créature a échoué.'
        : 'La création de la créature a échoué.';
  }
}
