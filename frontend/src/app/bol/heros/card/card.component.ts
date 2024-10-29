import {Component, inject, input, signal} from '@angular/core';
import {BolHerosModel} from "../../models/bol-heros.model";
import {BolHerosService} from "../../services/bol-heros.service";
import {toObservable} from "@angular/core/rxjs-interop";
import {exhaustMap, filter, Subscription} from "rxjs";
import {tap} from "rxjs/operators";
import {AsyncPipe, JsonPipe, NgIf} from "@angular/common";
import {CardModule} from "primeng/card";
import {SkeletonModule} from "primeng/skeleton";
import {TooltipModule} from "primeng/tooltip";
import {Button, ButtonDirective} from "primeng/button";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {BolActionComponent} from "./action/action.component";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {InlineSVGModule} from "ng-inline-svg-2";
import {Ripple} from "primeng/ripple";
import {BolHerosUpdateComponent} from "../update/update.component";
import {NgxSpinnerService} from "ngx-spinner";
import {BtnComponent} from "../../../shared/btn/btn.component";
import {TagModule} from "primeng/tag";

@Component({
  selector: 'bol-heros-card',
  standalone: true,
  imports: [
    AsyncPipe,
    JsonPipe,
    CardModule,
    SkeletonModule,
    NgIf,
    TooltipModule,
    Button,
    OverlayPanelModule,
    BolActionComponent,
    ButtonDirective,
    InlineSVGModule,
    Ripple,
    BtnComponent,
    TagModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class BolHerosCardComponent {

  private heroService = inject(BolHerosService);
  private dialogService = inject(DialogService);
  private spinner = inject(NgxSpinnerService);

  private ref?: DynamicDialogRef;
  private subs?: Subscription;
  questId = input<string | undefined>(undefined);
  heroId = input<string | null>(null);
  hero = signal<BolHerosModel | null>(null);

  hero$ = toObservable<string | null>(this.heroId).pipe( // Watch for user changes
    filter((id) => id !== null),                     // Only make http request for users larger than 0
    tap((id) => this.hero.set(null)),    // Just some debugging
    exhaustMap((id) =>                          // Don't execute the http request if one is already in progress
      this.heroService.heros(id as string, this.questId()).pipe(tap((hero) => this.hero.set(hero)))   // Update the response
    )
  );

  constructor() {
  }

  openAction() {
    this.dialogService.open(BolActionComponent, {
      header: 'Effectuer une action',
      maximizable: true,
      data: {
        hero: this.hero()
      }
    });
  }

  fichePerso() {
    this.ref = this.dialogService.open(BolHerosUpdateComponent, {
      header: 'Fiche de personnage',
      data: {
        heros: this.hero()
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((heros: BolHerosModel) => {
      if (heros) {
        this.spinner.show();
        this.subs?.unsubscribe();
        const actionService = this.heroService.quickUpdate(heros);
        this.subs = actionService.subscribe({
          next: (character: BolHerosModel) => {
            this.hero.set(character);
            this.spinner.hide();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }

}
