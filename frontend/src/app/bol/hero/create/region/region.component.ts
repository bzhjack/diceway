import {Component, OnDestroy} from '@angular/core';
import {BolHeroService} from "../../../services/bol-hero.service";
import {Subscription} from "rxjs";
import {BolHeroModel} from "../../../models/bol-hero.model";
import {NgxSpinnerService} from "ngx-spinner";

@Component({
  selector: 'app-region',
  standalone: true,
  imports: [],
  templateUrl: './region.component.html',
  styleUrl: './region.component.scss'
})
export class BolRegionComponent implements OnDestroy {
  private subs?: Subscription;

  constructor(private hs: BolHeroService, private spinner: NgxSpinnerService) {
    this.spinner.show();
    this.subs = this.hs.allRegions().subscribe({
      next: (regions: Array<any>) => {
        console.log(regions);
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
