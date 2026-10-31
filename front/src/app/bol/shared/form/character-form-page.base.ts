import {computed, inject} from '@angular/core';
import {FieldTree} from '@angular/forms/signals';
import {AVANTAGE_ARME_FAVORITE_ID} from '../../bol-rules.constants';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {addMenuOptions} from '../add-menu/add-menu.component';
import {etoilesArmeFavorite} from '../arme/arme-favorite.util';
import {ArmeEntry} from '../models/arme-list.model';
import {ArmureEntry} from '../models/armure-list.model';
import {CarriereEntry} from '../models/carriere-list.model';
import {CharacterFormDraft} from '../models/character-form.model';
import {LangueEntry} from '../models/langue-list.model';
import {TraitAddEvent} from '../models/trait-add-menu.model';
import {TraitDraft} from '../models/trait-entry.model';
import {traitEntriesSignal} from '../trait/trait-entry.utils';
import {BolEntityFormPageBase} from './entity-form-page.base';
import {availableCatalog, selectedEntries} from './form-selection';

/**
 * Socle des fiches d'un héros et d'un PNJ : catalogues, listes sélectionnées, menus d'ajout et étoile d'arme favorite. Un PNJ est un `BolHeros`, avec
 * le même équipement : seule change la fiche elle-même, que fournit la sous-classe.
 */
export abstract class BolCharacterFormPageBase<TFormModel extends CharacterFormDraft> extends BolEntityFormPageBase<BolHerosModel, TFormModel> {
  protected readonly herosStateService = inject(BolHerosStateService);

  protected readonly armesList = this.herosStateService.armeList;
  protected readonly armuresList = this.herosStateService.armureList;
  protected readonly carrieresList = this.herosStateService.carriereList;
  protected readonly languesList = this.herosStateService.langueList;
  protected readonly avantagesList = this.herosStateService.avantagesList;
  protected readonly desavantagesList = this.herosStateService.desavantagesList;

  /** Le champ du rang d'une carrière : la liste le règle directement dans le formulaire. */
  protected abstract carriereRank(index: number): FieldTree<number>;
  /** Une armure ajoutée est-elle portée d'emblée ? */
  protected abstract readonly newArmureEquipped: boolean;

  /** La région de l'arme favorite, et celle du personnage : un PNJ n'en a pas, aucune arme ne lui est donc interdite. */
  protected armeFavoriteRegion(_trait: TraitDraft): number | null {
    return null;
  }
  protected characterRegion(): number | null {
    return null;
  }

  protected readonly avatarPreview = computed(() => this.model().avatar);

  protected readonly selectedArmesDraft = computed(() => this.model().armes);
  protected readonly selectedArmuresDraft = computed(() => this.model().armures);
  protected readonly selectedCarrieresDraft = computed(() => this.model().carrieres);
  protected readonly selectedLanguesDraft = computed(() => this.model().langues);
  protected readonly selectedTraitsDraft = computed(() => this.model().traits);

  protected readonly filteredArmes = availableCatalog(this.armesList, this.selectedArmesDraft);
  protected readonly filteredArmures = availableCatalog(this.armuresList, this.selectedArmuresDraft);
  protected readonly filteredCarrieres = availableCatalog(this.carrieresList, this.selectedCarrieresDraft);
  protected readonly filteredLangues = availableCatalog(this.languesList, this.selectedLanguesDraft);
  protected readonly filteredAvantages = availableCatalog(this.avantagesList, () =>
    this.selectedTraitsDraft().filter((trait) => trait.type === 'A'),
  );
  protected readonly filteredDesavantages = availableCatalog(this.desavantagesList, () =>
    this.selectedTraitsDraft().filter((trait) => trait.type === 'D'),
  );

  protected readonly armeOptions = addMenuOptions(
    this.filteredArmes,
    (arme) => arme.arme,
    (arme) => (arme.degats ? `· Dégâts ${arme.degats}` : null),
  );
  protected readonly armureOptions = addMenuOptions(
    this.filteredArmures,
    (armure) => armure.armure,
    (armure) => (armure.protection ? `· Protection ${armure.protection}` : null),
  );
  protected readonly carriereOptions = addMenuOptions(this.filteredCarrieres, (carriere) => carriere.carriere);

  protected readonly selectedArmes = selectedEntries(
    this.selectedArmesDraft,
    this.armesList,
    (arme, entry): ArmeEntry => ({
      id: entry.id,
      label: arme.arme,
      degats: arme.degats,
      portee: arme.portee,
      notes: arme.notes,
      equipee: entry.equipee,
    }),
  );
  protected readonly selectedArmures = selectedEntries(
    this.selectedArmuresDraft,
    this.armuresList,
    (armure, entry): ArmureEntry => ({
      id: entry.id,
      label: armure.armure,
      protection: armure.protection,
      malus: armure.malus,
      ptsDePouvoir: armure.pts_de_pouvoir,
      categorie: armure.categorie,
      equipee: entry.equipee,
      malusAgilite: armure.malus_agilite,
      malusInitiative: armure.malus_initiative,
    }),
  );
  protected readonly selectedCarrieres = selectedEntries(
    this.selectedCarrieresDraft,
    this.carrieresList,
    (definition, entry, index): CarriereEntry => ({
      id: entry.id,
      label: definition.carriere,
      description: definition.description || null,
      rank: this.carriereRank(index),
    }),
  );
  protected readonly selectedLangues = selectedEntries(
    this.selectedLanguesDraft,
    this.languesList,
    (langue, entry): LangueEntry => ({
      id: entry.id,
      label: langue.langue,
      description: langue.description || null,
      estLemurienne: Boolean(langue.est_lemurienne),
    }),
  );
  protected readonly selectedTraitEntries = traitEntriesSignal(
    this.selectedTraitsDraft,
    this.avantagesList,
    this.desavantagesList,
  );

  /** Les étoiles « arme favorite » de la liste d'armes, si le personnage a l'avantage. */
  protected readonly etoilesArmes = computed(() => {
    const trait = this.model().traits.find((t) => t.type === 'A' && Number(t.id) === AVANTAGE_ARME_FAVORITE_ID);
    const favorite = trait ? {arme: trait.detail ?? null, regionId: this.armeFavoriteRegion(trait)} : null;
    return etoilesArmeFavorite(this.selectedArmes(), favorite, this.characterRegion());
  });

  constructor() {
    super();
    // Armes/armures sont éditables depuis l'intendance : recharger à chaque ouverture du formulaire.
    this.herosStateService.refreshEquipmentCatalog();
  }

  protected onFormSubmit(event: Event): void {
    event.preventDefault();
    this.save();
  }

  /** L'étoile d'une arme : elle devient l'arme favorite (ou ne l'est plus) ; enregistré avec la fiche. */
  protected toggleArmeFavorite(index: number): void {
    const entry = this.selectedArmes()[index];
    const etoile = this.etoilesArmes()?.[index];
    if (!entry || !etoile || etoile.raison) {
      return;
    }
    const arme = etoile.active ? null : entry.label;
    this.patchDraft({
      traits: this.model().traits.map((t) => (t.type === 'A' && Number(t.id) === AVANTAGE_ARME_FAVORITE_ID ? {...t, detail: arme} : t)),
    });
  }

  protected addArmeEntry(id: number): void {
    this.patchDraft({armes: [...this.model().armes, {id, equipee: true}]});
  }

  protected removeArme(index: number): void {
    this.patchDraft({armes: this.model().armes.filter((_, i) => i !== index)});
  }

  protected addArmureEntry(id: number): void {
    this.patchDraft({armures: [...this.model().armures, {id, equipee: this.newArmureEquipped}]});
  }

  protected removeArmure(index: number): void {
    this.patchDraft({armures: this.model().armures.filter((_, i) => i !== index)});
  }

  protected addLangueEntry(id: number): void {
    this.patchDraft({langues: [...this.model().langues, {id}]});
  }

  protected removeLangue(index: number): void {
    this.patchDraft({langues: this.model().langues.filter((_, i) => i !== index)});
  }

  protected addCarriereEntry(id: number): void {
    this.patchDraft({carrieres: [...this.model().carrieres, {id, value: 0}]});
  }

  protected removeCarriere(index: number): void {
    this.patchDraft({carrieres: this.model().carrieres.filter((_, i) => i !== index)});
  }

  protected addTraitEntry(entry: TraitAddEvent): void {
    this.patchDraft({traits: [...this.model().traits, {id: entry.id, type: entry.type}]});
  }

  protected removeTrait(index: number): void {
    this.patchDraft({traits: this.model().traits.filter((_, i) => i !== index)});
  }

  /** Une liste change sans passer par un champ : la fiche est marquée modifiée à la main, pour que quitter la page le signale. */
  protected patchDraft(change: Partial<CharacterFormDraft>): void {
    this.model.update((current) => ({...current, ...change} as TFormModel));
    this.entityForm().markAsDirty();
  }
}
