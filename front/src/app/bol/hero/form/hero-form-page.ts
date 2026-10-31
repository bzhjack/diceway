import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {applyEach, FieldTree, form, required} from '@angular/forms/signals';
import {Observable} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {isArmeEquipee} from '../../shared/arme/arme-equipee';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolRegionModel} from '../../models/bol-region.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {confirmDialog} from '../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {ArmeListComponent} from '../../shared/arme/list/arme-list.component';
import {ArmureListComponent} from '../../shared/armure/list/armure-list.component';
import {CarriereListComponent} from '../../shared/carriere/list/carriere-list.component';
import {TraitDraft} from '../../shared/models/trait-entry.model';
import {BolCharacterFormPageBase} from '../../shared/form/character-form-page.base';
import {EntityFormLabels} from '../../shared/models/entity-form-page.model';
import {applyArmureEquipToggle, referencedIds, toggleEquipee} from '../../shared/form/form-selection';
import {StatsGridComponent} from '../../shared/stats-grid/stats-grid.component';
import {StatGroup} from '../../shared/models/stats-grid.model';
import {HeroGeneralComponent} from './general/general.component';
import {SummaryRailComponent} from '../../shared/summary-rail/summary-rail.component';
import {HeroFormModel} from '../models/hero-form-page.model';
import {DwFormHeaderComponent} from '../../../shared/dw-form-header/dw-form-header';
import {ListPanelComponent} from '../../shared/list-panel/list-panel.component';

function heroFormDefaults(): HeroFormModel {
  return {
    id: null,
    active: false,
    type: 'H',
    nom: '',
    joueur: '',
    region_id: null,
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
    vitalite: 10,
    heroisme: 5,
    experience: 0,
    pouvoir: 0,
    foi: 0,
    creation: 0,
    armes: [],
    armures: [],
    carrieres: [],
    langues: [],
    traits: [],
  };
}

const HERO_STAT_GROUPS: readonly StatGroup[] = [
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
    columns: 3,
    cells: [
      {control: 'vitalite', label: 'Vitalité', highlight: true},
      {control: 'heroisme', label: 'Héroïsme', highlight: true},
      {control: 'experience', label: 'Expérience'},
      {control: 'pouvoir', label: 'Pouvoir'},
      {control: 'foi', label: 'Foi'},
      {control: 'creation', label: 'Création'},
    ],
  },
];

const HERO_FORM_LABELS: EntityFormLabels = {
  createTitle: 'Nouveau héros',
  editTitle: 'Modifier le héros',
  createEyebrow: 'Galerie BOL',
  editEyebrow: 'Édition galerie BOL',
  createSubmitLabel: 'Créer le brouillon',
  editSubmitLabel: 'Enregistrer',
  loadError: 'Le chargement du héros a échoué.',
  createError: 'La création du héros a échoué.',
  updateError: 'La mise à jour du héros a échoué.',
  unsavedChanges: 'Ce héros a des changements non sauvegardés. Quitter sans enregistrer ?',
  avatarDialogTitle: 'Avatar du héros',
};

@Component({
  selector: 'bol-hero-form-page',
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
    HeroGeneralComponent,
    StatsGridComponent,
    SummaryRailComponent,
  ],
  templateUrl: './hero-form-page.html',
  styleUrl: './hero-form-page.scss',
  host: {
    '(document:keydown.control.s)': 'onSaveShortcut($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroFormPageComponent extends BolCharacterFormPageBase<HeroFormModel> {
  private readonly herosService = inject(BolHerosService);
  protected readonly regionList = this.herosStateService.regionList;

  protected readonly labels = HERO_FORM_LABELS;
  protected readonly heroStatGroups = HERO_STAT_GROUPS;
  protected readonly newArmureEquipped = false;

  protected readonly model = signal<HeroFormModel>(heroFormDefaults());
  protected readonly heroForm = form(this.model, (fieldPath) => {
    required(fieldPath.nom, {message: 'Nom requis'});
    required(fieldPath.joueur, {message: 'Nom du joueur requis'});
    required(fieldPath.region_id, {message: 'Région requise'});
    required(fieldPath.vigueur);
    required(fieldPath.agilite);
    required(fieldPath.esprit);
    required(fieldPath.aura);
    required(fieldPath.initiative);
    required(fieldPath.melee);
    required(fieldPath.tir);
    required(fieldPath.defense);
    required(fieldPath.vitalite);
    required(fieldPath.heroisme);
    required(fieldPath.experience);
    required(fieldPath.pouvoir);
    required(fieldPath.foi);
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
    return this.heroForm;
  }

  protected carriereRank(index: number) {
    return this.heroForm.carrieres[index].value;
  }

  protected override armeFavoriteRegion(trait: TraitDraft): number | null {
    return trait.region_id ?? null;
  }

  protected override characterRegion(): number | null {
    return this.model().region_id ?? null;
  }

  /** Vue castée pour bol-stats-grid, qui n'accède qu'aux champs numériques. */
  protected readonly statsForm = this.heroForm as unknown as FieldTree<Record<string, number>>;

  protected readonly activateDisabled = computed(
    () => this.pending() || this.loading() || this.heroForm().invalid() || this.model().active,
  );

  protected readonly heroNom = computed(() => this.model().nom);
  protected readonly heroJoueur = computed(() => this.model().joueur);
  protected readonly heroVitalite = computed(() => this.model().vitalite);
  protected readonly heroHeroisme = computed(() => this.model().heroisme);

  protected readonly agiliteMalusTotal = computed(() =>
    this.selectedArmures()
      .filter((armure) => armure.equipee)
      .reduce((sum, armure) => sum + armure.malusAgilite, 0),
  );

  protected readonly initiativeMalusTotal = computed(() =>
    this.selectedArmures()
      .filter((armure) => armure.equipee)
      .reduce((sum, armure) => sum + armure.malusInitiative, 0),
  );

  protected readonly selectedRegion = computed(() => {
    const regionId = this.model().region_id;
    if (regionId === null) {
      return null;
    }

    return (this.regionList() ?? []).find((region: BolRegionModel) => region.id === regionId) ?? null;
  });

  protected readonly showGeneralHint = computed(
    () =>
      this.fieldError(this.heroForm.joueur) ||
      this.fieldError(this.heroForm.nom) ||
      this.fieldError(this.heroForm.region_id),
  );

  protected toggleArmeEquipped(index: number): void {
    this.patchDraft({armes: toggleEquipee(this.model().armes, index)});
  }

  protected toggleArmureEquipped(index: number): void {
    const catalog = this.armuresList() ?? [];
    this.patchDraft({
      armures: applyArmureEquipToggle(this.model().armures, index, (id) => catalog.find((a) => a.id === id)?.categorie ?? null),
    });
  }

  protected override save(): void {
    this.submit(false);
  }

  protected confirmActivation(): void {
    confirmDialog(this.dialog, {
      title: 'Activer le héros',
      message: 'Voulez-vous activer ce héros ?',
      confirmLabel: 'Oui, activer',
      cancelLabel: 'Non',
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.submit(true);
      }
    });
  }

  private submit(activate: boolean): void {
    const payload = this.buildPayload();
    payload['active'] = activate || Boolean(payload['active']);

    this.performSave(payload, (hero) => {
      if (!this.editMode() && !activate && hero.id) {
        this.navigateToDraft(hero.id);
        return;
      }

      this.navigateBack(true);
    });
  }

  protected loadEntity(id: string): Observable<BolHerosModel> {
    return this.herosService.heros(id);
  }

  protected createEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.createHeros(payload);
  }

  protected updateEntity(payload: Record<string, unknown>): Observable<BolHerosModel> {
    return this.herosService.updateHeros(payload);
  }

  protected resetForm(): void {
    this.model.set(heroFormDefaults());
  }

  protected hydrateForm(hero: BolHerosModel): void {
    this.model.set({
      id: hero.id,
      active: hero.active,
      type: 'H',
      nom: hero.origines.nom ?? '',
      joueur: hero.origines.joueur ?? '',
      region_id: hero.origines.region_id,
      commentaire: hero.origines.commentaire ?? '',
      avatar: hero.origines.avatar ?? null,
      vigueur: hero.attributs.vigueur,
      agilite: hero.attributs.agilite,
      esprit: hero.attributs.esprit,
      aura: hero.attributs.aura,
      initiative: hero.combat.initiative,
      melee: hero.combat.melee,
      tir: hero.combat.tir,
      defense: hero.combat.defense,
      vitalite: hero.ressources.vitalite,
      heroisme: hero.ressources.heroisme,
      experience: hero.ressources.experience,
      pouvoir: hero.ressources.pouvoir,
      foi: hero.ressources.foi,
      creation: hero.ressources.creation,
      armes: (hero.armes as (BolHerosArmeModel | number)[])
        .filter((arme): arme is BolHerosArmeModel => typeof arme === 'object')
        .map((arme) => ({id: arme.arme_id, equipee: isArmeEquipee(arme)})),
      armures: (hero.armures as (BolHerosArmureModel | number)[])
        .filter((armure): armure is BolHerosArmureModel => typeof armure === 'object')
        .map((armure) => ({id: armure.armure_id, equipee: Boolean(armure.equipee)})),
      langues: referencedIds(hero.origines.langues, (langue) => langue.langue_id).map((id) => ({id})),
      carrieres: hero.carrieres.map((carriere) => ({
        id: carriere.carriere_id ?? 0,
        value: carriere.value,
      })),
      traits: hero.traits.map((trait) => ({
        id: trait.traitable_id,
        type: trait.type,
        detail: trait.detail ?? null,
        region_id: trait.region_id ?? null,
      })),
    });
  }

  protected buildPayload(): Record<string, unknown> {
    const rawValue = this.model();
    const origines = {
      joueur: rawValue.joueur,
      nom: rawValue.nom,
      commentaire: rawValue.commentaire || null,
      region_id: rawValue.region_id,
      avatar: rawValue.avatar,
      langues: rawValue.langues.map((langue) => ({
        id: langue.id,
        langue_id: langue.id,
      })),
    };
    const attributs = {
      vigueur: rawValue.vigueur,
      agilite: rawValue.agilite,
      esprit: rawValue.esprit,
      aura: rawValue.aura,
    };
    const combat = {
      initiative: rawValue.initiative,
      melee: rawValue.melee,
      tir: rawValue.tir,
      defense: rawValue.defense,
    };
    const ressources = {
      vitalite: rawValue.vitalite,
      heroisme: rawValue.heroisme,
      experience: rawValue.experience,
      pouvoir: rawValue.pouvoir,
      foi: rawValue.foi,
      creation: rawValue.creation,
      vilenie: 0,
    };
    const carrieres = rawValue.carrieres.map((carriere) => ({
      id: carriere.id,
      carriere_id: carriere.id,
      value: carriere.value,
    }));
    // La précision et la région d'un trait (arme favorite, avantage régional) se gardent : la sauvegarde les remplaçait par null.
    const traits = rawValue.traits.map((trait) => ({
      id: trait.id,
      traitable_id: trait.id,
      type: trait.type,
      detail: trait.detail ?? null,
      region_id: trait.region_id ?? null,
      carriere: false,
    }));
    const armes = rawValue.armes.map((arme) => ({
      id: arme.id,
      arme_id: arme.id,
      equipee: arme.equipee,
    }));
    const armures = rawValue.armures.map((armure) => ({
      id: armure.id,
      armure_id: armure.id,
      equipee: armure.equipee,
    }));
    const langues = rawValue.langues.map((langue) => ({
      id: langue.id,
      langue_id: langue.id,
    }));

    return {
      id: rawValue.id,
      active: Boolean(rawValue.active),
      type: rawValue.type,
      nom: origines.nom,
      joueur: origines.joueur,
      region_id: origines.region_id,
      commentaire: origines.commentaire,
      avatar: origines.avatar,
      vigueur: attributs.vigueur,
      agilite: attributs.agilite,
      esprit: attributs.esprit,
      aura: attributs.aura,
      initiative: combat.initiative,
      melee: combat.melee,
      tir: combat.tir,
      defense: combat.defense,
      vitalite: ressources.vitalite,
      heroisme: ressources.heroisme,
      experience: ressources.experience,
      pouvoir: ressources.pouvoir,
      foi: ressources.foi,
      creation: ressources.creation,
      origines,
      attributs,
      combat,
      ressources,
      armes,
      armures,
      carrieres,
      langues,
      traits,
    };
  }

  private navigateToDraft(heroId: string | number): void {
    void this.router.navigate(['/create/hero', heroId], {
      state: this.returnUrl() ? {returnUrl: this.returnUrl()!} : undefined,
    });
  }
}
