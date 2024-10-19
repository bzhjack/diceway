import {Component, inject, input, signal} from '@angular/core';
import {BolHerosModel} from "../../models/bol-heros.model";
import {ButtonDirective} from "primeng/button";
import {CardModule} from "primeng/card";
import {FieldsetModule} from "primeng/fieldset";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {Ripple} from "primeng/ripple";
import {TagModule} from "primeng/tag";
import {TooltipModule} from "primeng/tooltip";
import {BolHerosService} from "../../services/bol-heros.service";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {NgxSpinnerService} from "ngx-spinner";
import {exhaustMap, filter, Subscription} from "rxjs";
import {toObservable} from "@angular/core/rxjs-interop";
import {tap} from "rxjs/operators";
import {BtnComponent} from "../../../shared/btn/btn.component";
import {BolActionComponent} from "../../heros/card/action/action.component";
import {KnobModule} from "primeng/knob";

@Component({
  selector: 'bol-pnj-card',
  standalone: true,
  imports: [
    ButtonDirective,
    CardModule,
    FieldsetModule,
    NgForOf,
    NgIf,
    Ripple,
    TagModule,
    TooltipModule,
    AsyncPipe,
    BtnComponent,
    KnobModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class BolPnjCardComponent {
  private heroService = inject(BolHerosService);
  private dialogService = inject(DialogService);
  private spinner = inject(NgxSpinnerService);

  private ref?: DynamicDialogRef;
  private subs?: Subscription;

  pnjId = input<string | null>(null);
  pnj = signal<BolHerosModel | null>(null);

  pnj$ = toObservable<string | null>(this.pnjId).pipe( // Watch for user changes
    filter((id) => id !== null),                     // Only make http request for users larger than 0
    tap((id) => this.pnj.set(null)),    // Just some debugging
    exhaustMap((id) =>                          // Don't execute the http request if one is already in progress
      this.heroService.pnj(id as string).pipe(tap((pnj) => this.pnj.set(pnj)))   // Update the response
    )
  );

  getType(pnj: BolHerosModel | null) {
    switch (pnj?.type) {
      case 'C':
        return 'Coriace';
      case 'R':
        return 'Rival';
      case 'P':
        return 'Piétaille';
    }
    return '';
  }

  getSeverity(pnj: BolHerosModel | null): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (pnj?.type) {
      case 'C':
        return 'warning';
      case 'R':
        return 'danger';
      case 'P':
        return 'secondary';
    }
    return undefined;
  }

  openAction() {
    this.dialogService.open(BolActionComponent, {
      header: 'Effectuer une action',
      maximizable: true,
      data: {
        hero: this.pnj()
      }
    });
  }

}
