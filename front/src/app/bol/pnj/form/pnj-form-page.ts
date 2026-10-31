import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {applyEach, FieldTree, form, required} from '@angular/forms/signals';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolPnjService} from '../../services/bol-pnj.service';
import {ArmeListComponent} from '../../shared/arme/list/arme-list.component';
import {ArmureListComponent} from '../../shared/armure/list/armure-list.component';
import {CarriereListComponent} from '../../shared/carriere/list/carriere-list.component';
import {BolCharacterFormPageBase} from '../../shared/form/character-form-page.base';
import {EntityFormLabels} from '../../shared/models/entity-form-page.model';
import {referencedIds} from '../../shared/form/form-selection';
import {StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {StatGroup} from '../../shared/models/stats-grid.model';
import {PnjGeneralComponent} from './general/pnj-general.component';
import {PnjTypeOption} from '../models/pnj-general.model';
import {SummaryRailComponent} from '../../shared/summary-rail/summary-rail.component';
import {PnjFormModel} from '../models/pnj-form-page.model';
import {DwFormHeaderComponent} from '../../../shared/dw-form-header/dw-form-header';
import {ListPanelComponent} from '../../shared/list-panel/list-panel.component';

function pnjFormDefaults(): PnjFormModel {
  return {
    id: null,
    nom: '',
    type: 'P',
    joueur: 'master',
    commentaire: '',
    avatar: null,
    vigueur: 0,
    agilite: 0,
    esprit: 0,
    aura: 0,
    initiative: 0,
    melee: 0,
    tir: 0,
    defense: 0,
    vitalite: 0,
    pouvoir: 0,
    foi: 0,
    vilenie: 0,
    creation: 0,
    armes: [],
    armures: [],
    carrieres: [],
    langues: [],
    traits: [],
  };
}

const PNJ_TYPE_LABELS: Readonly<Record<'P' | 'C' | 'R', string>> = {
  P: 'Piétaille',
  C: 'Coriace',
  R: 'Rival',
};

const PNJ_TYPE_OPTIONS: readonly PnjTypeOption[] = (
  Object.entries(PNJ_TYPE_LABELS) as ['P' | 'C' | 'R', string][]
).map(([value, label]) => ({label, value}));

const PNJ_STAT_GROUPS: readonly StatGroup[] = [
  {
    key: 'attr',
    label: 'Attributs',
    columns: 2,
    cells: [
      {control: 'vigueur', label: 'Vigueur'},
      {control: 'agilite', label: 'Agilité'},
      {control: 'esprit', label: 'Esprit'},
      {control: 'aura', label: 'Aura'},
    ],
  },
  {
    key: 'combat',
    label: 'Combat',
    columns: 2,
    cells: [
      {control: 'initiative', label: 'Initiative'},
      {control: 'melee', label: 'Mêlée'},
      {control: 'tir', label: 'Tir'},
      {control: 'defense', label: 'Défense'},
    ],
  },
  {
    key: 'res',
    label: 'Ressources',
    columns: 1,
    cells: [
      {control: 'vitalite', label: 'Vitalité', highlight: true},
      {control: 'vilenie', label: 'Vilénie'},
    ],
  },
];

const PNJ_FORM_LABELS: EntityFormLabels = {
  createTitle: 'Nouveau PNJ',
  editTitle: 'Modifier le PNJ',
  createEyebrow: 'Galerie BOL',
  editEyebrow: 'Édition galerie BOL',
  createSubmitLabel: 'Enregistrer le PNJ',
  editSubmitLabel: 'Mettre à jour le PNJ',
  loadError: 'Le chargement du PNJ a échoué.',
  createError: 'La création du PNJ a échoué.',
  updateError: 'La mise à jour du PNJ a échoué.',
  unsavedChanges: 'Ce PNJ a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar du PNJ',
};

@Component({
  selector: 'bol-pnj-form-page',
  imports: [
    ListPanelComponent,
    DwFormHeaderComponent,
    MatButtonModule,
    MatCard,
    MatCardContent,
    MatIconModule,
    ArmeListComponent,
    ArmureListComponent,
    CarriereListComponent,
    PnjGeneralComponent,
    StatsGridComponent,
    SummaryRailComponent,
  ],
  templateUrl: './pnj-form-page.html',
  styleUrl: './pnj-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjFormPageComponent extends BolCharacterFormPageBase<PnjFormModel> {
  private readonly pnjService = inject(BolPnjService);
  protected readonly labels = PNJ_FORM_LABELS;
  protected readonly typeOptions = PNJ_TYPE_OPTIONS;
  protected readonly pnjStatGroups = PNJ_STAT_GROUPS;
  // Un PNJ porte tout ce qu'il possède.
  protected readonly newArmureEquipped = true;

  protected readonly model = signal<PnjFormModel>(pnjFormDefaults());
  protected readonly pnjForm = form(this.model, (fieldPath) => {
    required(fieldPath.nom, {message: 'Nom requis'});
    required(fieldPath.type, {message: 'Type requis'});
    required(fieldPath.joueur);
    required(fieldPath.vigueur);
    required(fieldPath.agilite);
    required(fieldPath.esprit);
    required(fieldPath.aura);
    required(fieldPath.initiative);
    required(fieldPath.melee);
    required(fieldPath.tir);
    required(fieldPath.defense);
    required(fieldPath.vitalite);
    required(fieldPath.pouvoir);
    required(fieldPath.foi);
    required(fieldPath.vilenie);
    required(fieldPath.creation);

    applyEach(fieldPath.armes, (item) => required(item.id));
    applyEach(fieldPath.armures, (item) => required(item.id));
    applyEach(fieldPath.langues, (item) => required(item.id));
    applyEach(fieldPath.carrieres, (item) => {
      required(item.id);
      required(item.value);
    });
    applyEach(fieldPath.traits, (item) => {
      required(item.id);
      required(item.type);
    });
  });

  protected get entityForm() {
    return this.pnjForm;
  }

  protected carriereRank(index: number) {
    return this.pnjForm.carrieres[index].value;
  }

  /** Vue castée pour bol-stats-grid, qui n'accède qu'aux champs numériques. */
  protected readonly statsForm = this.pnjForm as unknown as FieldTree<Record<string, number>>;

  protected readonly pnjNom = computed(() => this.model().nom);
  protected readonly pnjType = computed(() => this.model().type);
  protected readonly pnjVitalite = computed(() => this.model().vitalite);
  protected readonly pnjTypeLabel = computed(() => PNJ_TYPE_LABELS[this.pnjType() ?? 'P']);

  protected readonly showGeneralHint = computed(
    () => this.fieldError(this.pnjForm.nom) || this.fieldError(this.pnjForm.type),
  );

  protected loadEntity(id: string): Observable<BolHerosModel> {
    return this.pnjService.pnj(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.pnjService.createPnj(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.pnjService.updatePnj(payload);
  }

  protected resetForm(): void {
    this.model.set(pnjFormDefaults());
  }

  protected hydrateForm(pnj: BolHerosModel): void {
    this.model.set({
      id: pnj.id,
      nom: pnj.origines.nom ?? '',
      type: (pnj.type as 'P' | 'C' | 'R') ?? 'P',
      joueur: pnj.origines.joueur ?? 'master',
      commentaire: pnj.origines.commentaire ?? '',
      avatar: pnj.origines.avatar ?? null,
      vigueur: pnj.attributs.vigueur,
      agilite: pnj.attributs.agilite,
      esprit: pnj.attributs.esprit,
      aura: pnj.attributs.aura,
      initiative: pnj.combat.initiative,
      melee: pnj.combat.melee,
      tir: pnj.combat.tir,
      defense: pnj.combat.defense,
      vitalite: pnj.ressources.vitalite,
      pouvoir: pnj.ressources.pouvoir,
      foi: pnj.ressources.foi,
      vilenie: pnj.ressources.vilenie,
      creation: pnj.ressources.creation,
      armes: (pnj.armes as (BolHerosArmeModel | number)[])
        .filter((arme): arme is BolHerosArmeModel => typeof arme === 'object')
        .map((arme) => ({id: arme.arme_id, equipee: true})),
      armures: (pnj.armures as (BolHerosArmureModel | number)[])
        .filter((armure): armure is BolHerosArmureModel => typeof armure === 'object')
        .map((armure) => ({id: armure.armure_id, equipee: true})),
      langues: referencedIds(pnj.origines.langues, (langue) => langue.langue_id).map((id) => ({id})),
      carrieres: pnj.carrieres.map((carriere) => ({
        id: carriere.carriere_id ?? 0,
        value: carriere.value,
      })),
      traits: pnj.traits.map((trait) => ({
        id: trait.traitable_id,
        type: trait.type,
        detail: trait.detail ?? null,
      })),
    });
  }

  protected buildPayload(): Record<string, unknown> {
    const rawValue = this.model();

    return {
      id: rawValue.id,
      nom: rawValue.nom,
      type: rawValue.type,
      joueur: rawValue.joueur,
      commentaire: rawValue.commentaire || null,
      avatar: rawValue.avatar,
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      aura: rawValue.aura,
      initiative: rawValue.initiative,
      melee: rawValue.melee,
      tir: rawValue.tir,
      defense: rawValue.defense,
      vitalite: rawValue.vitalite,
      pouvoir: rawValue.pouvoir,
      foi: rawValue.foi,
      vilenie: rawValue.vilenie,
      creation: rawValue.creation,
      armes: rawValue.armes.map((arme) => ({id: arme.id, equipee: arme.equipee})),
      armures: rawValue.armures.map((armure) => ({id: armure.id, equipee: armure.equipee})),
      carrieres: rawValue.carrieres.map((carriere) => ({
        id: carriere.id,
        value: carriere.value,
      })),
      langues: rawValue.langues.map((langue) => ({id: langue.id})),
      traits: rawValue.traits.map((trait) => ({
        id: trait.id,
        type: trait.type,
        detail: trait.detail ?? null,
      })),
    };
  }
}
