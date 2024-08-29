import {Component, inject} from '@angular/core';
import {AvatarModule} from "primeng/avatar";
import {Button} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {PrimeTemplate} from "primeng/api";
import {InputTextModule} from "primeng/inputtext";
import {FormBuilder, FormControl, Validators} from "@angular/forms";
import {NgxSpinnerService} from "ngx-spinner";
import {BolCreaturesService} from "../../services/bol-creatures.service";

@Component({
  selector: 'bol-creature-create',
  standalone: true,
  imports: [
    AvatarModule,
    Button,
    DialogModule,
    PrimeTemplate,
    InputTextModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class BolCreatureCreateComponent {

  private spinner = inject(NgxSpinnerService);
  private fb = inject(FormBuilder);
  private cs = inject(BolCreaturesService);

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
}
