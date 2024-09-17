import {Component, computed, inject, signal, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {map, Subscription} from "rxjs";
import {DialogService, DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {BolCarriereModel, BolHerosCarriereModel} from "../../models/bol-carriere.model";
import {PictureComponent} from "../../../shared/picture/picture.component";
import {DropdownModule} from "primeng/dropdown";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {FieldsetModule} from "primeng/fieldset";
import {InputNumberModule} from "primeng/inputnumber";
import {ConfirmationService} from "primeng/api";
import {Button, ButtonDirective} from "primeng/button";
import {JsonPipe, NgForOf, NgIf} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";
import {BolHerosStateService} from "../../services/bol-heros-state.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {Ripple} from "primeng/ripple";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {BolHerosModel} from "../../models/bol-heros.model";
import {BtnComponent} from "../../../shared/btn/btn.component";
import {BolAvantageModel} from "../../models/bol-avantage.model";
import {BolDesavantageModel} from "../../models/bol-desavantage.model";

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
    BtnComponent,
    Button,
    NgForOf,
    NgIf,
    TooltipModule,
    ButtonDirective,
    OverlayPanelModule,
    Ripple,
    JsonPipe
  ],
  providers: [
    ConfirmationService
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolPnjCreateComponent {
  @ViewChild('opPnj') panelPnj?: OverlayPanel;
  public type = [{type: 'Piétaille', value: 'P'}, {type: 'Coriaces', value: 'C'}, {type: 'Rivaux', value: 'R'}];

  private subs?: Subscription;
  private hs = inject(BolHerosStateService);
  private fb = inject(FormBuilder);
  readonly ds = inject(DialogService);

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public nomCtrl = new FormControl('', Validators.required);
  public joueurCtrl = new FormControl('master', Validators.required);
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

  public armuresCtrl = this.fb.array([]);
  public armesCtrl = this.fb.array([]);
  public carrieresCtrl = this.fb.array([]);
  public traitsCtrl = this.fb.array([]);
  public languesCtrl = this.fb.array([]);

  public commentaireCtrl = new FormControl<string | null>(null);
  public vitaliteCtrl = new FormControl(0, Validators.required);
  public pouvoirCtrl = new FormControl(0, Validators.required);
  public foiCtrl = new FormControl(0, Validators.required);
  public vilenieCtrl = new FormControl(0, Validators.required);
  public creationCtrl = new FormControl(0, Validators.required);

  pnjForm = this.fb.group(
    {
      id: this.idCtrl,
      joueur: this.joueurCtrl,
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
      pouvoir: this.pouvoirCtrl,
      foi: this.foiCtrl,
      creation: this.creationCtrl,
      vilenie: this.vilenieCtrl,
      armes: this.armesCtrl,
      armures: this.armuresCtrl,
      carrieres: this.carrieresCtrl,
      traits: this.traitsCtrl,
      langues: this.languesCtrl,
      commentaire: this.commentaireCtrl
    });

  get armes() {
    return this.pnjForm.get('armes') as FormArray;
  }

  get armures() {
    return this.pnjForm.get('armures') as FormArray;
  }

  get carrieres() {
    return this.pnjForm.get('carrieres') as FormArray;
  }

  get traits() {
    return this.pnjForm.get('traits') as FormArray;
  }

  get langues() {
    return this.pnjForm.get('langues') as FormArray;
  }

  /*** Gestion des armes ***/
  protected langueList = this.hs.langueList;
  protected armeList = this.hs.armeList;
  protected armureList = this.hs.armureList;
  protected carriereList = this.hs.carriereList;
  protected avantageList = this.hs.avantagesList;
  protected desavantageList = this.hs.desavantagesList;

  public selectedItem = signal<any | null>(null);
  public itemTitle = signal('Armes');
  public currentField = signal<string>('armes');

  protected unselectedItems = signal<any[]>([])

  protected selectedArmesIds = toSignal(this.pnjForm.get('armes')!.valueChanges.pipe(map((items: any[]) => items.map(item => Number(item.id)))));
  protected selectedArmes = computed(() => {
    return this.armeList()?.filter((item: any) => this.selectedArmesIds()?.includes(Number(item.id)))
  });
  protected unselectedArmes = computed(() => {
    return this.armeList()?.filter((item: any) => !this.selectedArmesIds()?.includes(Number(item.id)))
  });
  protected selectedArmuresIds = toSignal(this.pnjForm.get('armures')!.valueChanges.pipe(map((items: any[]) => items.map(item => Number(item.id)))));
  protected selectedArmures = computed(() => {
    return this.armureList()?.filter((item: any) => this.selectedArmuresIds()?.includes(Number(item.id)))
  });
  protected unselectedArmures = computed(() => {
    return this.armureList()?.filter((item: any) => !this.selectedArmuresIds()?.includes(Number(item.id)))
  });

  protected selectedCarrieresIds = toSignal(this.pnjForm.get('carrieres')!.valueChanges.pipe(map((items: any[]) => items.map(item => Number(item.id)))));
  protected unselectedCarrieres = computed(() => {
    return this.carriereList()?.filter((item: any) => !this.selectedCarrieresIds()?.includes(Number(item.id)))
  });

  protected selectedTraitsIds = toSignal(this.pnjForm.get('traits')!.valueChanges.pipe(
    map((items: any[]) => items.map(item => ({id: Number(item.id), type: item.type})))
  ));
  protected unselectedAvantages = computed(() => {
    const selectedAIds = this.selectedTraitsIds()
      ?.filter(item => item.type === 'A') // Ne garder que les éléments dont le type est 'A'
      .map(item => item.id); // Extraire les IDs
    return this.avantageList()?.filter((item: any) =>
      !selectedAIds?.includes(Number(item.id)) // Comparer uniquement les IDs filtrés
    );
  });
  protected unselectedDesavantages = computed(() => {
    const selectedDIds = this.selectedTraitsIds()
      ?.filter(item => item.type === 'D') // Ne garder que les éléments dont le type est 'A'
      .map(item => item.id); // Extraire les IDs
    return this.desavantageList()?.filter((item: any) =>
      !selectedDIds?.includes(Number(item.id)) // Comparer uniquement les IDs filtrés
    );
  });

  protected selectedLanguesIds = toSignal(
    this.pnjForm
      .get('langues')!
      .valueChanges.pipe(
      map((items: any[]) => items.map((item) => Number(item.id)))
    )
  );
  protected unselectedLangues = computed(() => {
    return this.langueList()?.filter(
      (item: any) => !this.selectedLanguesIds()?.includes(Number(item.id))
    );
  });
  protected selectedLangues = computed(() => {
    return this.langueList()?.filter((item: any) =>
      this.selectedLanguesIds()?.includes(Number(item.id))
    );
  });


  constructor(private ref: DynamicDialogRef, private config: DynamicDialogConfig) {
    if (this.config.data.pnj) {
      const pnj = this.config.data.pnj as BolHerosModel;
      this.pnjForm.patchValue({
        id: pnj.id,
        type: pnj.type,
        nom: pnj.origines.nom,
        avatar: pnj.origines.avatar,
        vigueur: pnj.attributs.vigueur,
        agilite: pnj.attributs.agilite,
        esprit: pnj.attributs.esprit,
        aura: pnj.attributs.aura,
        initiative: pnj.combat.initiative,
        tir: pnj.combat.tir,
        melee: pnj.combat.melee,
        defense: pnj.combat.defense,
        commentaire: pnj.commentaire,
        vitalite: pnj.ressources.vitalite,
        pouvoir: pnj.ressources.pouvoir,
        foi: pnj.ressources.foi,
        vilenie: pnj.ressources.vilenie,
        creation: pnj.ressources.creation

      }, {emitEvent: false});
      this.armes.clear();
      pnj.armes.forEach((arme: any) => {
        const heroArme = this.fb.group({
          id: [arme.arme_id]
        });
        this.armes.push(heroArme);
      });

      this.armures.clear();
      pnj.armures.forEach((armure: any) => {
        const heroArmure = this.fb.group({
          id: [armure.armure_id]
        });
        this.armures.push(heroArmure);
      });

      this.carrieres.clear();
      pnj.carrieres.forEach((carriere: BolHerosCarriereModel) => {
        const heroCarriere = this.fb.group({
          id: [carriere.carriere_id],
          value: [carriere.value],
        });
        this.carrieres.push(heroCarriere);
      });

      this.traits.clear();
      pnj.traits.forEach((trait: any) => {
        const heroTrait = this.fb.group({
          id: [trait.traitable_id],
          type: [trait.type]
        });
        this.traits.push(heroTrait);
      });

      this.langues.clear();
      pnj.origines.langues.forEach((langue: any) => {
        const heroLangue = this.fb.group({
          id: [langue.langue_id],
        });
        this.langues.push(heroLangue);
      });
    }
  }

  removeItem(itemId: number, items: FormArray) {
    const index = items.value.findIndex((item: any) => Number(item.id) === Number(itemId))
    if (index !== -1) items.removeAt(index)
  }

  removeTrait(trait: { id: number, type: 'A' | 'D' }, items: FormArray) {
    const index = items.value.findIndex((item: any) => Number(item.id) === Number(trait.id) && item.type === trait.type);
    if (index !== -1) items.removeAt(index)
  }

  addItem(type: 'A' | 'D' | 'C' | 'TA' | 'TD' | 'L', ev: Event) { // Attaque Défense Carriere Avantage Désavantage
    this.selectedItem.set(null);
    switch (type) {
      case 'A':
        this.currentField.set('armes');
        this.unselectedItems.set(this.unselectedArmes());
        this.itemTitle.set('Armes');
        break;
      case 'D':
        this.currentField.set('armures');
        this.unselectedItems.set(this.unselectedArmures());
        this.itemTitle.set('Armures');
        break;
      case 'C':
        this.currentField.set('carrieres');
        this.unselectedItems.set(this.unselectedCarrieres());
        this.itemTitle.set('Carrières');
        break;
      case 'TA':
        this.currentField.set('avantages');
        this.unselectedItems.set(this.unselectedAvantages() as any);
        this.itemTitle.set('Avantages');
        break;
      case 'TD':
        this.currentField.set('desavantages');
        this.unselectedItems.set(this.unselectedDesavantages() as any);
        this.itemTitle.set('Désavantages');
        break;
      case 'L':
        this.currentField.set('langues');
        this.unselectedItems.set(this.unselectedLangues() as any);
        this.itemTitle.set('Langues');
        break;
    }
    this.panelPnj?.toggle(ev);
  }


  createItem(panel: OverlayPanel, event: any) {
    panel.toggle(event);

    switch (this.currentField()) {
      case 'armes':
        const arme = this.fb.group({
          id: [this.selectedItem()?.id],
        });
        this.armes.push(arme);
        break;
      case 'armures':
        const armure = this.fb.group({
          id: [this.selectedItem()?.id],
        });
        this.armures.push(armure);
        break;
      case 'carrieres':
        const carriere = this.fb.group({
          id: [this.selectedItem()?.id],
          value: 0
        });
        this.carrieres.push(carriere);
        break;
      case 'langues':
        const langue = this.fb.group({
          id: [this.selectedItem()?.id],
        });
        this.langues.push(langue);
        break;
      case 'desavantages':
      case 'avantages':
        const trait = this.fb.group({
          id: [this.selectedItem()?.id],
          type: this.currentField() === 'avantages' ? 'A' : 'D'
        });
        this.traits.push(trait);
        break;
    }

  }

  carriereFromId(id: number) {
    const carriere = this.carriereList()?.find((itemCar: BolCarriereModel) => Number(itemCar.id) === Number(id));
    return carriere?.carriere ?? '';
  }

  traitFromIdType(trait: { id: number, type: 'A' | 'D' }) {
    const result = (trait.type === 'A' ? this.avantageList() : this.desavantageList())?.find((item: BolAvantageModel | BolDesavantageModel) => Number(item.id) === Number(trait.id));
    return (result as BolDesavantageModel)?.desavantage ?? (result as BolAvantageModel)?.avantage;
  }

  quit(event: Event) {
    event.preventDefault();
    this.ref.close(null);
  }

  submit(event?: Event) {
    event?.preventDefault();
    if (this.pnjForm.invalid) {
      return;
    }
    this.ref.close(this.pnjForm.value);
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
