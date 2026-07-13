import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {FormArray, ReactiveFormsModule, Validators} from '@angular/forms';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolCreatureModel} from '../../models/bol-creature.model';
import {BolCreatureStateService} from '../../services/bol-creature-state.service';
import {BolCreaturesService} from '../../services/bol-creatures.service';
import {AddMenuEvent} from '../../shared/add-menu/add-menu.component';
import {CapaciteEntry} from '../../shared/capacite/list/capacite-list.component';
import {BolEntityFormPageBase, EntityFormLabels} from '../../shared/form/entity-form-page.base';
import {DetailDraft, availableCatalog, selectedEntries} from '../../shared/form/form-selection';
import {controlValueSignal, formArrayValueSignal, formDirtySignal} from '../../shared/form/form-signals';
import {StatGroup, StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {traitIconType} from '../../shared/trait-icon';
import {CreatureCapacitesComponent} from './capacites/creature-capacites.component';
import {CreatureGeneralComponent} from './general/creature-general.component';

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

const CREATURE_FORM_LABELS: EntityFormLabels = {
  createTitle: 'Nouvelle créature',
  editTitle: 'Modifier la créature',
  createEyebrow: 'Bestiaire BOL',
  editEyebrow: 'Édition bestiaire BOL',
  createSubmitLabel: 'Enregistrer la créature',
  editSubmitLabel: 'Mettre à jour la créature',
  loadError: 'Le chargement de la créature a échoué.',
  createError: 'La création de la créature a échoué.',
  updateError: 'La mise à jour de la créature a échoué.',
  unsavedChanges: 'Cette créature a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar de la créature',
};

@Component({
  selector: 'bol-creature-form-page',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatButtonModule,
    MatIconModule,
    CreatureGeneralComponent,
    CreatureCapacitesComponent,
    StatsGridComponent,
  ],
  templateUrl: './creature-form-page.html',
  styleUrl: './creature-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureFormPageComponent extends BolEntityFormPageBase<BolCreatureModel> {
  private readonly creatureStateService = inject(BolCreatureStateService);
  private readonly creaturesService = inject(BolCreaturesService);

  protected readonly tailles = this.creatureStateService.tailleList;
  protected readonly capacitesList = this.creatureStateService.capaciteList;

  protected readonly labels = CREATURE_FORM_LABELS;
  protected readonly creatureStatGroups = CREATURE_STAT_GROUPS;

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

  protected get entityForm() {
    return this.creatureForm;
  }

  protected readonly formDirty = formDirtySignal(this.creatureForm);

  protected readonly tailleId = controlValueSignal(this.creatureForm.controls.id_taille);
  protected readonly avatarPreview = controlValueSignal(this.creatureForm.controls.avatar);

  protected readonly selectedCapacitesDraft = formArrayValueSignal<DetailDraft>(this.capacites);
  protected readonly selectedTaille = computed(() =>
    (this.tailles() ?? []).find((taille) => Number(taille.id) === Number(this.tailleId())),
  );
  protected readonly filteredCapacites = availableCatalog(this.capacitesList, this.selectedCapacitesDraft);
  protected readonly selectedCapaciteEntries = selectedEntries(
    this.selectedCapacitesDraft,
    this.capacitesList,
    (definition, entry): CapaciteEntry => ({
      id: Number(entry.id),
      label: definition.capacite,
      description: definition.description || null,
      detail: entry.detail || null,
      icon: traitIconType(definition),
      tone: definition.de_bonus ? 'positive' : definition.de_malus ? 'negative' : 'neutral',
    }),
  );

  constructor() {
    super();
    this.setupReferenceDefaults(
      this.selectedTaille,
      (taille) => Number(taille.id),
      (taille) => ({
        vigueur: taille.vigueur ?? 0,
        vitalite: taille.vitalite ?? 0,
        degats: taille.degats ?? '0',
      }),
    );
  }

  protected get capacites(): FormArray {
    return this.creatureForm.controls.capacites as FormArray;
  }

  protected addCapaciteEntry(event: AddMenuEvent): void {
    this.capacites.push(
      this.formBuilder.group({
        id: this.formBuilder.control(event.id, Validators.required),
        detail: this.formBuilder.control(event.detail),
      }),
    );
    this.capacites.markAsDirty();
  }

  protected removeCapacite(index: number): void {
    this.removeItem(this.capacites, index);
  }

  protected loadEntity(id: string): Observable<BolCreatureModel> {
    return this.creaturesService.creature(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.creaturesService.createCreature(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolCreatureModel> {
    return this.creaturesService.updateCreature(payload);
  }

  protected resetForm(): void {
    this.hydratedReferenceId = null;
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
    this.syncArrays(this.capacites);
  }

  protected hydrateForm(creature: BolCreatureModel): void {
    this.hydratedReferenceId = Number(creature.id_taille);
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
    this.syncArrays(this.capacites);
  }

  protected buildPayload(): Record<string, unknown> {
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
      capacites: (rawValue.capacites as DetailDraft[]).map((capacite) => ({
        id: capacite.id,
        detail: capacite.detail,
      })),
    };
  }
}
