import { Component } from '@angular/core';
import {CardModule} from "primeng/card";
import {SharedModule} from "primeng/api";
import {DynamicDialogConfig, DynamicDialogModule, DynamicDialogRef} from "primeng/dynamicdialog";
import {DialogModule} from "primeng/dialog";
import {BolHerosService} from "../../../services/bol-heros.service";
import {NgxSpinnerService} from "ngx-spinner";
import {Subscription} from "rxjs";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-trait',
  standalone: true,
  imports: [
    CardModule,
    SharedModule,
    DynamicDialogModule,
    DialogModule,
    NgIf
  ],
  templateUrl: './trait.component.html',
  styleUrl: './trait.component.scss'
})
export class BolTraitComponent {
  private subs?: Subscription;
  public regions: any[] = [];
  public currentRegion?: any;
  public selectedName?: string;
  public ready = false;

  constructor(
    private hs: BolHerosService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private spinner: NgxSpinnerService) {
    const regionId= this.config.data.id_region;
    this.spinner.show();
    this.ready = false;
    this.subs = this.hs.allRegions().subscribe({
      next: (regions: Array<any>) => {
        this.ready = true;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }
}
