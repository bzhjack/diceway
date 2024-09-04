import {Component, computed, inject, signal, ViewChild, viewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {map, Subscription} from "rxjs";
import {BolCreatureStateService} from "../../services/bol-creature-state.service";
import {DialogService} from "primeng/dynamicdialog";
import {BolHerosCarriereModel} from "../../models/bol-carriere.model";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {DropdownModule} from "primeng/dropdown";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {FieldsetModule} from "primeng/fieldset";
import {InputNumberModule} from "primeng/inputnumber";
import {BolHerosCarrieresComponent} from "../../heros/create/carrieres/carrieres.component";
import {ConfirmationService} from "primeng/api";
import {BtnComponent} from "../../../shared/trash/trash.component";
import {Button, ButtonDirective} from "primeng/button";
import {NgForOf, NgIf} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";
import {BolHerosStateService} from "../../services/bol-heros-state.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {BolArmeModel, BolHerosArmeModel} from "../../models/bol-arme.model";
import {BolCreatureCapaciteModel} from "../../models/bol-creature.model";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {Ripple} from "primeng/ripple";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";

@Component({
  selector: 'bol-pnj-create',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    InputTextModule,
    InputTextareaModule,
    FieldsetModule,
    InputNumberModule,
    BolHerosCarrieresComponent,
    BtnComponent,
    Button,
    NgForOf,
    NgIf,
    TooltipModule,
    ButtonDirective,
    OverlayPanelModule,
    Ripple
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolPnjCreateComponent {
  @ViewChild('opPnj') panelPnj?: OverlayPanel;
  public type= [{type: 'Piétaille', value: 'P'}, {type: 'Coriaces', value: 'C'}, {type: 'Rivaux', value: 'R'}];

  private subs?: Subscription;
  private hs = inject(BolHerosStateService);
  private fb = inject(FormBuilder);
  readonly ds = inject(DialogService);

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public nomCtrl = new FormControl('', Validators.required);
  public typeCtrl = new FormControl('P', Validators.required);
  public avatarCtrl: FormControl<string | null> = new FormControl(null);
  public vigueurCtrl = new FormControl(0, Validators.required);
  public agiliteCtrl = new FormControl(0, Validators.required);
  public espritCtrl = new FormControl(0, Validators.required);
  public auraCtrl = new FormControl(0, Validators.required);

  public initiativeCtrl = new FormControl(0, Validators.required);
  public meleeCtrl = new FormControl(0, Validators.required);
  public tirCtrl = new FormControl(0, Validators.required);
  public defenseCtrl = new FormControl(0, Validators.required);

  public armuresCtrl =  this.fb.array([]);
  public armesCtrl =  this.fb.array([]);
  public carrieresCtrl =  this.fb.array([]);
  public commentaireCtrl = new FormControl(null);
  public vitaliteCtrl = new FormControl(0, Validators.required);

  pnjForm = this.fb.group(
    {
      id: this.idCtrl,
      nom: this.nomCtrl,
      type: this.typeCtrl,
      avatar: this.avatarCtrl,
      vigueur: this.vigueurCtrl,
      initiative: this.initiativeCtrl,
      agilite: this.agiliteCtrl,
      esprit: this.espritCtrl,
      aura: this.auraCtrl,
      melee: this.meleeCtrl,
      tir: this.tirCtrl,
      defense: this.defenseCtrl,
      vitalite: this.vitaliteCtrl,
      armes: this.armesCtrl,
      armures: this.armuresCtrl,
      carrieres: this.carrieresCtrl,
      commentaire: this.commentaireCtrl
    });
  get armes() { return this.pnjForm.get('armes') as FormArray;  }
  get armures() { return this.pnjForm.get('armures') as FormArray;  }
  get carrieres() { return this.pnjForm.get('carrieres') as FormArray;  }

  /*** Gestion des armes ***/
  protected armeList = this.hs.armeList;

  public selectedItem= signal< any | null>(null);
  public itemTitle = signal('Armes');
  public currentItems = signal<any[]>([]);
  public currentField = signal<string>('armes');
  protected selectedItemIds = toSignal(this.pnjForm.get(this.currentField())!.valueChanges.pipe(map((items: any[]) => items.map(item => item.id))));
  protected filteredItemList = computed(() => {
    return this.currentItems()?.filter((item: any) => !this.selectedItemIds()?.includes(item.id));
  });
  protected selectedItemDetail = computed(() => {
    return this.currentItems()?.filter((item: any) => this.selectedItemIds()?.includes(item.id))
  });
  removeItem(itemId: number, items: FormArray) {
    const index = items.value.findIndex((item: any) => item.id === itemId)
    if (index !== -1) items.removeAt(index)
  }

  addItem(type: 'A' | 'D' | 'C', ev: Event) { // Attaque Défense Carriere
    this.selectedItem.set(null);
    switch (type) {
      case "A":
        this.currentItems.set(this.armeList());
        this.currentField.set('armes');
        this.itemTitle.set('Armes');
    }
    this.panelPnj?.toggle(ev);
  }










  picture() {
    const ref = this.ds.open(PictureComponent, {header: 'Photo du pnj'});
    this.subs?.unsubscribe();
    this.subs = ref.onClose.subscribe((avatar: any) => {
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
      }
    });
  }
}
