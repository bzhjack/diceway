import {Component, inject} from '@angular/core';
import {AvatarModule} from "primeng/avatar";
import {Button} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {PrimeTemplate} from "primeng/api";
import {InputTextModule} from "primeng/inputtext";
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgxSpinnerService} from "ngx-spinner";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {BolCreatureStateService} from "../../services/bol-creature-state.service";
import {globalFormValidator} from "../../heros/create/create.validators";
import {BolHerosCarriereModel} from "../../models/bol-carriere.model";
import {BolCreatureCapaciteModel} from "../../models/bol-creature.model";
import {FieldsetModule} from "primeng/fieldset";
import {InputNumberModule} from "primeng/inputnumber";
import {DropdownModule} from "primeng/dropdown";

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
    DropdownModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolCreatureCreateComponent {
  private cs = inject(BolCreatureStateService);
  private spinner = inject(NgxSpinnerService);
  private fb = inject(FormBuilder);
  tailles = this.cs.tailleList;

  public idCtrl: FormControl<string | null> = new FormControl(null);
  public nomCtrl = new FormControl('', Validators.required);
  public vigueurCtrl = new FormControl(0, Validators.required);
  public agiliteCtrl = new FormControl(0, Validators.required);
  public espritCtrl = new FormControl(0, Validators.required);
  public vitaliteCtrl = new FormControl(0, Validators.required);

  public attaqueCtrl = new FormControl(0, Validators.required);
  public defenseCtrl = new FormControl(0, Validators.required);

  public protectionCtrl = new FormControl('0', Validators.required);
  public degatsCtrl = new FormControl('0', Validators.required);
  public idTailleCtrl = new FormControl(null, Validators.required);
  public capacitesCtrl = new FormControl<BolCreatureCapaciteModel[]>([]);

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
      idTaille: this.idTailleCtrl,
      commentaire: this.commentaireCtrl,
      capacites: this.capacitesCtrl
    }
  );
  submit() {
    if (this.creatureForm.invalid) {
      return;
    }
  }
}
