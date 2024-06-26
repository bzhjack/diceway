import {Component} from '@angular/core';
import {Subscription} from "rxjs";
import {BolHerosService} from "../../../services/bol-heros.service";
import {DynamicDialogConfig, DynamicDialogRef} from "primeng/dynamicdialog";
import {NgxSpinnerService} from "ngx-spinner";
import {NgForOf, NgIf} from "@angular/common";
import {FieldsetModule} from "primeng/fieldset";
import {BolTraitRowComponent} from "../trait/trait-row/trait-row.component";
import {CheckboxModule} from "primeng/checkbox";
import {ScrollPanelModule} from "primeng/scrollpanel";
import {BolCarriereModel} from "../../../models/bol-carriere.model";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-carriere',
  standalone: true,
  imports: [
    NgIf,
    FieldsetModule,
    BolTraitRowComponent,
    CheckboxModule,
    NgForOf,
    ScrollPanelModule,
    FormsModule
  ],
  templateUrl: './carriere.component.html',
  styleUrl: './carriere.component.scss'
})
export class BolCarriereComponent {
  private subs?: Subscription;
  public carrieres: BolCarriereModel[] = [];
  public selectedCarrieres: BolCarriereModel[] = [];
  constructor(
    private hs: BolHerosService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private spinner: NgxSpinnerService
  ) {
    this.getCarrieres();
  }

  getCarrieres() {
    this.spinner.show();
    this.subs?.unsubscribe();
    this.subs = this.hs.carrieres().subscribe({
      next: (carrieres: any) => {
        this.spinner.hide();
        this.carrieres = carrieres;
        console.log(carrieres);
      },
      error: () => {
        this.spinner.hide();
      }
    })
  }
}
