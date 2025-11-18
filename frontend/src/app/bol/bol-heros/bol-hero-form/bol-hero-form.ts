import {Component, computed, inject, signal, viewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators,} from '@angular/forms';
import {map, Subscription} from 'rxjs';
import {DialogService, DynamicDialogConfig, DynamicDialogRef,} from 'primeng/dynamicdialog';
import {BolCarriereModel, BolHerosCarriereModel,} from '../../bol-models/bol-carriere.model';
import {Picture} from '../../../picture/picture';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {FieldsetModule} from 'primeng/fieldset';
import {InputNumberModule} from 'primeng/inputnumber';
import {ConfirmationService} from 'primeng/api';
import {ButtonDirective, ButtonModule} from 'primeng/button';
import {TooltipModule} from 'primeng/tooltip';
import {BolHerosStateService} from '../../bol-services/bol-heros-state.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {Ripple} from 'primeng/ripple';
import {BolHerosModel} from '../../bol-models/bol-heros.model';
import {BtnComponent} from '../../../btn/btn.component';
import {BolAvantageModel} from '../../bol-models/bol-avantage.model';
import {BolDesavantageModel} from '../../bol-models/bol-desavantage.model';
import {Popover, PopoverModule} from 'primeng/popover';
import {SelectModule} from 'primeng/select';
import {FloatLabel} from 'primeng/floatlabel';
import {AutoFocus} from 'primeng/autofocus';
import {BolHerosTrait} from './bol-hero-trait/bol-hero-trait';

@Component({
  selector: 'bol-heros-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    TextareaModule,
    FieldsetModule,
    InputNumberModule,
    BtnComponent,
    TooltipModule,
    ButtonDirective,
    Ripple,
    BolHerosTrait,
    PopoverModule,
    FloatLabel,
    AutoFocus,
    ButtonModule
  ],
  providers: [ConfirmationService],
  templateUrl: './bol-hero-form.html',
  standalone: true,
  styleUrl: './bol-hero-form.scss'
})
export class BolHerosForm {
  readonly panelHeros = viewChild<Popover>('opHeros');
  public type = [
    {type: 'Piétaille', value: 'P'},
    {type: 'Coriaces', value: 'C'},
    {type: 'Rivaux', value: 'R'},
  ];

  private subs?: Subscription;
  private hs = inject(BolHerosStateService);
  private fb = inject(FormBuilder);
  readonly ds = inject(DialogService);

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public nomCtrl = new FormControl('', Validators.required);
  public joueurCtrl = new FormControl('', Validators.required);
  public typeCtrl = new FormControl('H', Validators.required);
  public regionCtrl = new FormControl<number | null>(null, Validators.required);
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
  public vitaliteCtrl = new FormControl(10, Validators.required);
  public pouvoirCtrl = new FormControl(0, Validators.required);
  public creationCtrl = new FormControl(0, Validators.required);
  public foiCtrl = new FormControl(0, Validators.required);
  public heroismeCtrl = new FormControl(5, Validators.required);
  public experienceCtrl = new FormControl(0, Validators.required);

  herosForm = this.fb.group({
    id: this.idCtrl,
    type: this.typeCtrl,
    nom: this.nomCtrl,
    commentaire: this.commentaireCtrl,
    joueur: this.joueurCtrl,
    avatar: this.avatarCtrl,
    region_id: this.regionCtrl,
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
    creation: this.creationCtrl,
    foi: this.foiCtrl,
    heroisme: this.heroismeCtrl,
    experience: this.experienceCtrl,
    armes: this.armesCtrl,
    armures: this.armuresCtrl,
    carrieres: this.carrieresCtrl,
    traits: this.traitsCtrl,
    langues: this.languesCtrl,
  });

  get armes() {
    return this.herosForm.get('armes') as FormArray;
  }

  get armures() {
    return this.herosForm.get('armures') as FormArray;
  }

  get carrieres() {
    return this.herosForm.get('carrieres') as FormArray;
  }

  get traits() {
    return this.herosForm.get('traits') as FormArray;
  }

  get langues() {
    return this.herosForm.get('langues') as FormArray;
  }

  /*** Gestion des armes ***/
  protected armeList = this.hs.armeList;
  protected armureList = this.hs.armureList;
  protected carriereList = this.hs.carriereList;
  protected avantageList = this.hs.avantagesList;
  protected desavantageList = this.hs.desavantagesList;
  protected regionList = this.hs.regionList;
  protected langueList = this.hs.langueList;

  public searchFilter = signal('');
  public selectedItem = signal<any | null>(null);
  public itemTitle = signal('Armes');
  public currentField = signal<string>('armes');

  protected unselectedItems = signal<any[]>([]);

  protected selectedArmesIds = toSignal(
    this.herosForm
      .get('armes')!
      .valueChanges.pipe(
      map((items: any[]) => items.map((item) => Number(item.id)))
    )
  );
  protected selectedArmes = computed(() => {
    return this.armeList()?.filter((item: any) =>
      this.selectedArmesIds()?.includes(Number(item.id))
    );
  });
  protected unselectedArmes = computed(() => {
    return this.armeList()?.filter(
      (item: any) => !this.selectedArmesIds()?.includes(Number(item.id))
    );
  });
  protected selectedArmuresIds = toSignal(
    this.herosForm
      .get('armures')!
      .valueChanges.pipe(
      map((items: any[]) => items.map((item) => Number(item.id)))
    )
  );
  protected selectedArmures = computed(() => {
    return this.armureList()?.filter((item: any) =>
      this.selectedArmuresIds()?.includes(Number(item.id))
    );
  });
  protected unselectedArmures = computed(() => {
    return this.armureList()?.filter(
      (item: any) => !this.selectedArmuresIds()?.includes(Number(item.id))
    );
  });

  protected selectedCarrieresIds = toSignal(
    this.herosForm
      .get('carrieres')!
      .valueChanges.pipe(
      map((items: any[]) => items.map((item) => Number(item.id)))
    )
  );
  protected unselectedCarrieres = computed(() => {
    return this.carriereList()?.filter(
      (item: any) => !this.selectedCarrieresIds()?.includes(Number(item.id))
    );
  });

  protected selectedLanguesIds = toSignal(
    this.herosForm
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

  protected selectedTraitsIds = toSignal(
    this.herosForm
      .get('traits')!
      .valueChanges.pipe(
      map((items: any[]) =>
        items.map((item) => ({id: Number(item.id), type: item.type}))
      )
    )
  );
  protected unselectedAvantages = computed(() => {
    const selectedAIds = this.selectedTraitsIds()
      ?.filter((item) => item.type === 'A') // Ne garder que les éléments dont le type est 'A'
      .map((item) => item.id); // Extraire les IDs
    return this.avantageList()?.filter(
      (item: any) => !selectedAIds?.includes(Number(item.id)) // Comparer uniquement les IDs filtrés
    );
  });
  protected unselectedDesavantages = computed(() => {
    const selectedDIds = this.selectedTraitsIds()
      ?.filter((item) => item.type === 'D') // Ne garder que les éléments dont le type est 'A'
      .map((item) => item.id); // Extraire les IDs
    return this.desavantageList()?.filter(
      (item: any) => !selectedDIds?.includes(Number(item.id)) // Comparer uniquement les IDs filtrés
    );
  });

  constructor(
    private ref: DynamicDialogRef,
    protected config: DynamicDialogConfig
  ) {
    if (this.config.data.heros) {
      const heros = this.config.data.heros as BolHerosModel;
      this.herosForm.patchValue(
        {
          id: heros.id,
          joueur: heros.origines.joueur,
          nom: heros.origines.nom,
          region_id: Number(heros.origines.region_id),
          avatar: heros.origines.avatar,
          vigueur: heros.attributs.vigueur,
          agilite: heros.attributs.agilite,
          esprit: heros.attributs.esprit,
          aura: heros.attributs.aura,
          initiative: heros.combat.initiative,
          tir: heros.combat.tir,
          melee: heros.combat.melee,
          defense: heros.combat.defense,
          commentaire: heros.origines.commentaire,
          vitalite: heros.ressources.vitalite,
          pouvoir: heros.ressources.pouvoir,
          creation: heros.ressources.creation,
          foi: heros.ressources.foi,
          heroisme: heros.ressources.heroisme,
          experience: heros.ressources.experience
        },
        {emitEvent: false}
      );
      this.armes.clear();
      heros.armes.forEach((arme: any) => {
        const heroArme = this.fb.group({
          id: [arme.arme_id],
        });
        this.armes.push(heroArme);
      });

      this.armures.clear();
      heros.armures.forEach((armure: any) => {
        const heroArmure = this.fb.group({
          id: [armure.armure_id],
        });
        this.armures.push(heroArmure);
      });

      this.carrieres.clear();
      heros.carrieres.forEach((carriere: BolHerosCarriereModel) => {
        const heroCarriere = this.fb.group({
          id: [carriere.carriere_id],
          value: [carriere.value],
        });
        this.carrieres.push(heroCarriere);
      });

      this.traits.clear();
      heros.traits.forEach((trait: any) => {
        const heroTrait = this.fb.group({
          id: [trait.traitable_id],
          type: [trait.type],
        });
        this.traits.push(heroTrait);
      });

      this.langues.clear();
      heros.origines.langues.forEach((langue: any) => {
        const heroLangue = this.fb.group({
          id: [langue.langue_id],
        });
        this.langues.push(heroLangue);
      });
    }
  }

  removeItem(itemId: number, items: FormArray) {
    const index = items.value.findIndex(
      (item: any) => Number(item.id) === Number(itemId)
    );
    if (index !== -1) items.removeAt(index);
  }

  removeTrait(trait: { id: number; type: 'A' | 'D' }, items: FormArray) {
    const index = items.value.findIndex(
      (item: any) =>
        Number(item.id) === Number(trait.id) && item.type === trait.type
    );
    if (index !== -1) items.removeAt(index);
  }

  addItem(type: 'A' | 'D' | 'C' | 'TA' | 'TD' | 'L', ev: Event) {
    // Attaque Défense Carriere Avantage Désavantage
    this.selectedItem.set(null);
    switch (type) {
      case 'A':
        this.currentField.set('armes');
        this.searchFilter.set('arme');
        this.unselectedItems.set(this.unselectedArmes());
        this.itemTitle.set('Armes');
        break;
      case 'D':
        this.currentField.set('armures');
        this.searchFilter.set('armure');
        this.unselectedItems.set(this.unselectedArmures());
        this.itemTitle.set('Armures');
        break;
      case 'C':
        this.currentField.set('carrieres');
        this.searchFilter.set('carriere');
        this.unselectedItems.set(this.unselectedCarrieres());
        this.itemTitle.set('Carrières');
        break;
      case 'TA':
        this.currentField.set('avantages');
        this.searchFilter.set('avantage');
        this.unselectedItems.set(this.unselectedAvantages() as any);
        this.itemTitle.set('Avantages');
        break;
      case 'TD':
        this.currentField.set('desavantages');
        this.searchFilter.set('desavantage');
        this.unselectedItems.set(this.unselectedDesavantages() as any);
        this.itemTitle.set('Désavantages');
        break;
      case 'L':
        this.currentField.set('langues');
        this.searchFilter.set('langue');
        this.unselectedItems.set(this.unselectedLangues() as any);
        this.itemTitle.set('Langues');
        break;
    }
    this.panelHeros()?.toggle(ev);
  }

  createItem(panel: Popover, event: any) {
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
          value: 0,
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
          type: this.currentField() === 'avantages' ? 'A' : 'D',
        });
        this.traits.push(trait);
        break;
    }
  }

  carriereFromId(id: number) {
    const carriere = this.carriereList()?.find(
      (itemCar: BolCarriereModel) => Number(itemCar.id) === Number(id)
    );
    return carriere?.carriere ?? '';
  }

  avantageFromId(id: number) {
    return this.avantageList()?.find((item: BolAvantageModel) => Number(item.id) === Number(id));
  }

  desavantageFromId(id: number) {
    return this.desavantageList()?.find((item: BolDesavantageModel) => Number(item.id) === Number(id));
  }

  quit(event: Event) {
    event.preventDefault();
    this.ref.close(null);
  }

  submit(event?: Event) {
    event?.preventDefault();
    if (this.herosForm.invalid) {
      return;
    }
    this.ref.close(this.herosForm.value);
  }

  picture() {
    const ref = this.ds.open(Picture, {header: 'Photo du Heros'});
    this.subs?.unsubscribe();
    this.subs = ref?.onClose.subscribe((avatar: any) => {
      if (avatar !== null && avatar !== undefined) {
        this.avatarCtrl.setValue(avatar);
      }
    });
  }
}
