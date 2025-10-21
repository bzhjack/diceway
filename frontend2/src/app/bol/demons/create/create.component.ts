import {Component, computed, effect, inject, OnDestroy, signal} from '@angular/core';
import {AvatarModule} from "primeng/avatar";
import {ButtonDirective} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {PrimeTemplate} from "primeng/api";
import {InputTextModule} from "primeng/inputtext";
import {FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {FieldsetModule} from "primeng/fieldset";
import {InputNumberModule} from "primeng/inputnumber";
import {DropdownModule} from "primeng/dropdown";
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {InputTextareaModule} from "primeng/inputtextarea";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {map, Subscription} from "rxjs";
import {toSignal} from '@angular/core/rxjs-interop';
import {NgForOf, NgIf} from '@angular/common';
import {OverlayPanel, OverlayPanelModule} from 'primeng/overlaypanel';
import {Ripple} from "primeng/ripple";
import {TooltipModule} from "primeng/tooltip";
import {BtnComponent} from "../../../shared/btn/btn.component";
import {BolDemonStateService} from "../../services/bol-demon-state.service";
import {BolDemonCategorieModel, BolDemonPouvoirModel} from "../../models/bol-demon.model";


@Component({
    selector: 'bol-demon-create',
  imports: [
    AvatarModule,
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
    TooltipModule,
    BtnComponent
  ],
    templateUrl: './create.component.html',
    styleUrl: './create.component.scss'
})
export class BolDemonCreateComponent implements OnDestroy {
  private subs?: Subscription;
  private demonService = inject(BolDemonStateService);
  private fb = inject(FormBuilder);
  readonly ds = inject(DialogService);
  public selectedPouvoir = signal<BolDemonPouvoirModel | null>(null);

  categories = this.demonService.categorieList;
  pouvoirsList = this.demonService.pouvoirList;

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public nomCtrl = new FormControl('', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);
  public idCategorieCtrl = new FormControl<number | null>(null, Validators.required);
  public commentaireCtrl = new FormControl<string | null>(null);

  public vigueurCtrl = new FormControl(0, Validators.required);
  public agiliteCtrl = new FormControl(0, Validators.required);
  public espritCtrl = new FormControl(0, Validators.required);
  public auraCtrl = new FormControl(0, Validators.required);


  public meleeCtrl = new FormControl(0, Validators.required);
  public tirCtrl = new FormControl(0, Validators.required);
  public defenseCtrl = new FormControl(0, Validators.required);
  public vitaliteCtrl = new FormControl(0, Validators.required);

  public degatsCtrl = new FormControl('0', Validators.required);


  public pouvoirsCtrl = this.fb.array([]);



  demonForm = this.fb.group(
    {
      id: this.idCtrl,
      nom: this.nomCtrl,
      commentaire: this.commentaireCtrl,
      avatar: this.avatarCtrl,
      id_categorie: this.idCategorieCtrl,

      vigueur: this.vigueurCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      aura: this.auraCtrl,

      melee: this.meleeCtrl,
      tir: this.tirCtrl,
      defense: this.defenseCtrl,
      degats: this.degatsCtrl,
      vitalite: this.vitaliteCtrl,

      pouvoirs: this.pouvoirsCtrl,
    }
  );

  protected selectedPouvoirIds = toSignal(this.demonForm.get('pouvoirs')!.valueChanges.pipe(map((items: any[]) => items.map(item => Number(item.id)))));
  protected filteredPouvoirList = computed(() => {
    const selectedIds = this.selectedPouvoirIds();
    const pouvoirDetails = this.pouvoirs.value;
    return this.pouvoirsList()?.filter((pouvoir: BolDemonPouvoirModel) => {
      const selectedPouvoir = pouvoirDetails.find((c: any) => Number(c.id) === Number(pouvoir.id));
      if (selectedPouvoir) {
        pouvoir.detail = selectedPouvoir.detail;
      }
      return !selectedIds?.includes(Number(pouvoir.id));
    });
  });

  protected selectedPouvoirDetail = computed(() => {
    return this.pouvoirsList()?.filter((pouvoir: BolDemonPouvoirModel) => this.selectedPouvoirIds()?.includes(Number(pouvoir.id)));
  });
  categorieChange = toSignal(this.idCategorieCtrl.valueChanges);

  get pouvoirs() {
    return this.demonForm.get('pouvoirs') as FormArray;
  }

  constructor(private ref: DynamicDialogRef, private config: DynamicDialogConfig) {
    if (this.config.data.demon) {
      const demon = this.config.data.demon;
      demon.id_categorie = Number(demon.id_categorie);
      this.demonForm.patchValue(demon, {emitEvent: false});
      this.pouvoirs.clear();
      demon.pouvoirs.forEach((power: any) => {
        const pouvoir = this.fb.group({
          id: [power.pouvoir_id],
          detail: [power.detail]
        });
        this.pouvoirs.push(pouvoir);
      });
    }

    effect(() => {
      if (this.categorieChange()) {
        const categorie = this.categories()?.find((categorie: BolDemonCategorieModel) => Number(categorie.id) === Number(this.categorieChange()));
        this.degatsCtrl.setValue(categorie?.degats ?? null);
        this.vitaliteCtrl.setValue(categorie?.vitalite ?? 0);
      }
    });
  }

  submit(event?: Event) {
    event?.preventDefault();
    if (this.demonForm.invalid) {
      return;
    }
    this.ref.close(this.demonForm.value);
  }

  quit(event: Event) {
    event.preventDefault();
    this.ref.close(null);
  }

  picture() {
    const ref = this.ds.open(PictureComponent, {header: 'Photo du démon'});
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

  clearSelectedPouvoir() {
    this.selectedPouvoir.set(null);
  }

  addPouvoir(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    const pouvoir = this.fb.group({
      id: [this.selectedPouvoir()?.id],
      detail: [this.selectedPouvoir()?.detail]
    });
    this.pouvoirs.push(pouvoir);
  }

  removePouvoir(pouvoirId: number) {
    const index = this.pouvoirs.value.findIndex((power: BolDemonPouvoirModel) => Number(power.id) === Number(pouvoirId))
    if (index !== -1) this.pouvoirs.removeAt(index)
  }
}
