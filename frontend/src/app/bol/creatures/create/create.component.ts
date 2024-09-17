import {Component, computed, effect, inject, OnDestroy, signal} from '@angular/core';
import {AvatarModule} from "primeng/avatar";
import {Button, ButtonDirective} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {PrimeTemplate} from "primeng/api";
import {InputTextModule} from "primeng/inputtext";
import {FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {BolCreatureStateService} from "../../services/bol-creature-state.service";
import {BolCreatureCapaciteModel, BolCreatureTailleModel} from "../../models/bol-creature.model";
import {FieldsetModule} from "primeng/fieldset";
import {InputNumberModule} from "primeng/inputnumber";
import {DropdownModule} from "primeng/dropdown";
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {InputTextareaModule} from "primeng/inputtextarea";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {map, Subscription} from "rxjs";
import {toSignal} from '@angular/core/rxjs-interop';
import {JsonPipe, NgForOf, NgIf} from '@angular/common';
import {OverlayPanel, OverlayPanelModule} from 'primeng/overlaypanel';
import {Ripple} from "primeng/ripple";
import {TooltipModule} from "primeng/tooltip";
import {BtnComponent} from "../../../shared/btn/btn.component";


@Component({
  selector: 'bol-creature-create',
  standalone: true,
  imports: [
    AvatarModule,
    Button,
    DialogModule,
    PrimeTemplate,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    FieldsetModule,
    InputNumberModule,
    DropdownModule,
    OverlayPanelModule,
    ButtonDirective,
    InputTextareaModule,
    NgIf,
    Ripple,
    NgForOf,
    JsonPipe,
    TooltipModule,
    BtnComponent
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolCreatureCreateComponent implements OnDestroy {
  private subs?: Subscription;
  private cs = inject(BolCreatureStateService);
  private fb = inject(FormBuilder);
  readonly ds = inject(DialogService);
  public selectedCapacite = signal<BolCreatureCapaciteModel | null>(null);

  tailles = this.cs.tailleList;
  capacitesList = this.cs.capaciteList;

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);
  public vigueurCtrl = new FormControl(0, Validators.required);
  public agiliteCtrl = new FormControl(0, Validators.required);
  public espritCtrl = new FormControl(0, Validators.required);
  public vitaliteCtrl = new FormControl(0, Validators.required);

  public attaqueCtrl = new FormControl(0, Validators.required);
  public defenseCtrl = new FormControl(0, Validators.required);

  public protectionCtrl = new FormControl('0', Validators.required);
  public degatsCtrl = new FormControl('0', Validators.required);
  public idTailleCtrl = new FormControl<number | null>(null, Validators.required);
  public capacitesCtrl = this.fb.array([]);
  public commentaireCtrl = new FormControl<string | null>(null);

  creatureForm = this.fb.group(
    {
      id: this.idCtrl,
      nom: this.nomCtrl,
      vigueur: this.vigueurCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      vitalite: this.vitaliteCtrl,
      attaque: this.attaqueCtrl,
      defense: this.defenseCtrl,
      protection: this.protectionCtrl,
      degat: this.degatsCtrl,
      id_taille: this.idTailleCtrl,
      commentaire: this.commentaireCtrl,
      avatar: this.avatarCtrl,
      capacites: this.capacitesCtrl,
    }
  );

  protected selectedCapaciteIds = toSignal(this.creatureForm.get('capacites')!.valueChanges.pipe(map((items: any[]) => items.map(item => Number(item.id)))));
  protected filteredCapaciteList = computed(() => {
    const selectedIds = this.selectedCapaciteIds();
    const capaciteDetails = this.capacites.value;
    // Filtrer les capacités qui ne sont pas encore sélectionnées
    return this.capacitesList()?.filter((capacite: BolCreatureCapaciteModel) => {
      const selectedCapacite = capaciteDetails.find((c: any) => Number(c.id) === Number(capacite.id));
      // Ajouter le detail de la capacité sélectionnée, s'il existe
      if (selectedCapacite) {
        capacite.detail = selectedCapacite.detail;
      }
      // Retourner les capacités qui ne sont pas dans la liste des IDs sélectionnés
      return !selectedIds?.includes(Number(capacite.id));
    });
  });

  protected selectedCapaciteDetail = computed(() => {
    return this.capacitesList()?.filter((capa: BolCreatureCapaciteModel) => this.selectedCapaciteIds()?.includes(Number(capa.id)));
  });
  tailleChange = toSignal(this.idTailleCtrl.valueChanges);

  get capacites() {
    return this.creatureForm.get('capacites') as FormArray;
  }

  constructor(private ref: DynamicDialogRef, private config: DynamicDialogConfig) {
    if (this.config.data.creature) {
      const creature = this.config.data.creature;
      creature.id_taille = Number(creature.id_taille);
      this.creatureForm.patchValue(creature, {emitEvent: false});
      this.capacites.clear();
      creature.capacites.forEach((capa: any) => {
        const capacite = this.fb.group({
          id: [capa.capacite_id],
          detail: [capa.detail]
        });
        this.capacites.push(capacite);
      });
    }

    effect(() => {
      if (this.tailleChange()) {
        const taille = this.tailles()?.find((taille: BolCreatureTailleModel) => Number(taille.id) === Number(this.tailleChange()));
        this.degatsCtrl.setValue(taille?.degat ?? null);
        this.vigueurCtrl.setValue(taille?.vigueur ?? 0);
        this.vitaliteCtrl.setValue(taille?.vitalite ?? 0);
      }
    });
  }

  submit(event?: Event) {
    event?.preventDefault();
    if (this.creatureForm.invalid) {
      return;
    }
    this.ref.close(this.creatureForm.value);
  }

  quit(event: Event) {
    event.preventDefault();
    this.ref.close(null);
  }

  picture() {
    const ref = this.ds.open(PictureComponent, {header: 'Photo de la créature'});
    this.subs?.unsubscribe();
    this.subs = ref.onClose.subscribe((avatar: any) => {
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
      }
    });
  }

  ngOnDestroy() {
    this.subs?.unsubscribe()
  }

  clearSelectedCapacite() {
    this.selectedCapacite.set(null);
  }

  addCapacite(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    const capacite = this.fb.group({
      id: [this.selectedCapacite()?.id],
      detail: [this.selectedCapacite()?.detail]
    });
    this.capacites.push(capacite);
  }

  removeCapacite(capaciteId: number) {
    const index = this.capacites.value.findIndex((capa: BolCreatureCapaciteModel) => Number(capa.id) === Number(capaciteId))
    if (index !== -1) this.capacites.removeAt(index)
  }
}
