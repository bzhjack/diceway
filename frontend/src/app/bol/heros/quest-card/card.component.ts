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
import {BolActionComponent} from "../../quest/action/action.component";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {InlineSVGModule} from "ng-inline-svg-2";
import {Ripple} from "primeng/ripple";
import {BolHerosUpdateComponent} from "../update/update.component";
import {NgxSpinnerService} from "ngx-spinner";
import {BtnComponent} from "../../../shared/btn/btn.component";
import {TagModule} from "primeng/tag";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {InputTextModule} from "primeng/inputtext";
import {InputNumberModule} from "primeng/inputnumber";
import {BolQuestService} from "../../services/bol-quest.service";
import {BolQuestProtagonistModel} from "../../models/bol-quest.model";

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
    TagModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    InputNumberModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class BolQuestHerosCardComponent {

  private heroService = inject(BolHerosService);
  private questService = inject(BolQuestService);
  private dialogService = inject(DialogService);
  private spinner = inject(NgxSpinnerService);

  private ref?: DynamicDialogRef;
  private subs?: Subscription;

  ressources = {
    vitalite: 0,
    heroisme: 0,
    vilenie: 0
  }
  questProtagonistId = input<number>(0);
  questProtagonist = signal<BolQuestProtagonistModel | null>(null);
  hero = signal<BolHerosModel | null>(null);

  questProtagonist$ = toObservable<number>(this.questProtagonistId).pipe( // Watch for user changes
    filter((id) => id > 0),                     // Only make http request for users larger than 0
    tap((id) => this.questProtagonist.set(null)),    // Just some debugging
    exhaustMap((id) =>                          // Don't execute the http request if one is already in progress
      this.questService.questProtagonist(id).pipe(tap((questProtagonist) => {
        this.questProtagonist.set(questProtagonist);
        this.hero.set(questProtagonist.protagonist as BolHerosModel);
      }))   // Update the response
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
            this.hero.set(Object.assign({}, this.hero(), character));
            this.spinner.hide();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }

  openResources(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    this.ressources.heroisme = Number(this.questProtagonist()?.heroisme ?? 0);
    this.ressources.vitalite = Number(this.questProtagonist()?.vitalite ?? 0);
  }

  modifResources(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    this.subs?.unsubscribe();
    this.spinner.show();
    this.subs?.unsubscribe();
    const actionService = this.questService.updateProtagonistToQuest(this.questProtagonistId(), this.ressources);
    this.subs = actionService.subscribe({
      next: (result: BolQuestProtagonistModel) => {
        this.questProtagonist.set(Object.assign({}, this.questProtagonist(), result));
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }
}
