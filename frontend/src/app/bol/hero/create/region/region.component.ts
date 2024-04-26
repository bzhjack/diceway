import {Component, OnDestroy} from '@angular/core';
import {BolHeroService} from "../../../services/bol-hero.service";
import {Subscription} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {DataViewModule} from "primeng/dataview";
import {NgForOf} from "@angular/common";
import {PanelModule} from "primeng/panel";
import {ButtonModule} from "primeng/button";
import {DynamicDialogRef} from "primeng/dynamicdialog";

@Component({
  selector: 'app-region',
  standalone: true,
  imports: [
    DataViewModule,
    NgForOf,
    PanelModule,
    ButtonModule
  ],
  templateUrl: './region.component.html',
  styleUrl: './region.component.scss'
})
export class BolRegionComponent implements OnDestroy {
  private subs?: Subscription;
  public regions: any[] = [];
  constructor(
    private hs: BolHeroService,
    public ref: DynamicDialogRef,
    private spinner: NgxSpinnerService) {
    this.spinner.show();
    this.subs = this.hs.allRegions().subscribe({
      next: (regions: Array<any>) => {
        console.log(regions);
        this.regions = regions;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  quit() {
    this.ref.close(null);
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
