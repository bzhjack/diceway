import {Component, computed, effect, inject, OnDestroy, signal} from '@angular/core';
import {AvatarModule} from "primeng/avatar";
import {Button, ButtonDirective} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {PrimeTemplate} from "primeng/api";
import {InputTextModule} from "primeng/inputtext";
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgxSpinnerService} from "ngx-spinner";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {BolCreatureStateService} from "../../services/bol-creature-state.service";
import {globalFormValidator} from "../../heros/create/create.validators";
import {BolHerosCarriereModel} from "../../models/bol-carriere.model";
import {BolCreatureCapaciteModel, BolCreatureModel, BolCreatureTailleModel} from "../../models/bol-creature.model";
import {FieldsetModule} from "primeng/fieldset";
import {InputNumberModule} from "primeng/inputnumber";
import {DropdownModule} from "primeng/dropdown";
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {InputTextareaModule} from "primeng/inputtextarea";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {Subscription} from "rxjs";
import { toSignal } from '@angular/core/rxjs-interop';
import { NgIf } from '@angular/common';
import { OverlayPanel, OverlayPanelModule } from 'primeng/overlaypanel';

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
    NgIf
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolCreatureCreateComponent implements OnDestroy {
  private subs?: Subscription;
  private cs = inject(BolCreatureStateService);
  private spinner = inject(NgxSpinnerService);
  private fb = inject(FormBuilder);
  readonly ds = inject(DialogService);
  public selectedCapacite= signal< BolCreatureCapaciteModel | null>(null);

  tailles = this.cs.tailleList;
  capacites = this.cs.capaciteList;

  currentCreature = signal<BolCreatureModel | null>(null)

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
  public idTailleCtrl = new FormControl(null, Validators.required);
  public capacitesCtrl = new FormControl<Number[]>([]);

  public commentaireCtrl = new FormControl(null);

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
      avatar :this.avatarCtrl,
      capacites: this.capacitesCtrl,
    }
  );

  protected selectedCapaciteIds = toSignal(this.creatureForm.get('capacites')!.valueChanges);
  protected filteredCapaciteList = computed(() => {
    return this.capacites()?.filter((capacite: BolCreatureCapaciteModel) => !this.selectedCapaciteIds()?.includes(capacite.id));
  });

  tailleChange = toSignal(this.idTailleCtrl.valueChanges);
  constructor(private ref: DynamicDialogRef, private config: DynamicDialogConfig) {
    if (config.data.creature) {
      const creature = config.data.creature;
      console.log(creature);
      this.currentCreature.set(creature);
      this.creatureForm.patchValue(creature, {emitEvent: false});
    }
    
    effect(() => {
      if(this.tailleChange()) {
        const taille = this.tailles()?.find((taille: BolCreatureTailleModel) => Number(taille.id) === Number(this.tailleChange()));
        this.degatsCtrl.setValue(taille?.degat ?? null);
        this.vigueurCtrl.setValue(taille?.vigueur ?? 0);
        this.vitaliteCtrl.setValue(taille?.vitalite ?? 0);
        console.log(taille);
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

  addCapacite(panel: OverlayPanel, event: any) {
    panel.toggle(event);
  
  }

}
