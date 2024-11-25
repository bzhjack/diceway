import {Component, computed, inject, input, output, signal} from '@angular/core';
import {BolHerosModel} from "../../models/bol-heros.model";
import {BolHerosService} from "../../services/bol-heros.service";
import {toObservable} from "@angular/core/rxjs-interop";
import {exhaustMap, filter, Subscription} from "rxjs";
import {tap} from "rxjs/operators";
import {AsyncPipe, NgIf} from "@angular/common";
import {CardModule} from "primeng/card";
import {SkeletonModule} from "primeng/skeleton";
import {TooltipModule} from "primeng/tooltip";
import {ButtonDirective} from "primeng/button";
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
import {ConfirmationService} from "primeng/api";
import {ConfirmPopupModule} from "primeng/confirmpopup";

@Component({
    selector: 'bol-heros-card',
  imports: [
    AsyncPipe,
    CardModule,
    SkeletonModule,
    NgIf,
    TooltipModule,
    OverlayPanelModule,
    ButtonDirective,
    InlineSVGModule,
    Ripple,
    BtnComponent,
    TagModule,
    FormsModule,
    InputTextModule,
    ReactiveFormsModule,
    InputNumberModule,
    ConfirmPopupModule
  ],
    providers: [
        ConfirmationService
    ],
    templateUrl: './card.component.html',
    styleUrl: './card.component.scss'
})
export class BolQuestHerosCardComponent {

  private heroService = inject(BolHerosService);
  private dialogService = inject(DialogService);
  private spinner = inject(NgxSpinnerService);
  private questService = inject(BolQuestService);
  private confirmationService = inject(ConfirmationService);

  private ref?: DynamicDialogRef;
  private subs?: Subscription;
  ressources = {
    vitalite: 0,
    heroisme: 0,
    vilenie: 0
  }
  deleted = output();
  questProtagonistId = input<number>(0);
  questProtagonist = signal<BolQuestProtagonistModel | null>(null);
  hero= computed(() => this.questProtagonist()?.protagonist as BolHerosModel);

  questProtagonist$ = toObservable<number>(this.questProtagonistId).pipe( // Watch for user changes
    filter((id) => id > 0),                     // Only make http request for users larger than 0
    tap((id) => this.questProtagonist.set(null)),    // Just some debugging
    exhaustMap((id) =>                          // Don't execute the http request if one is already in progress
      this.questService.questProtagonist(id).pipe(tap((questProtagonist) => {
        this.questProtagonist.set(questProtagonist);
      }))
    )
  );

  openAction() {
    const hero: BolHerosModel = this.questProtagonist()?.protagonist as BolHerosModel;
    this.dialogService.open(BolActionComponent, {
      header: hero.origines.nom + 'va effectuer une action.',
      maximizable: true,
      data: {
        hero: this.questProtagonist()?.protagonist
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

  fichePerso() {
    this.ref = this.dialogService.open(BolHerosUpdateComponent, {
      header: 'Fiche de personnage',
      data: {
        heros: this.questProtagonist()?.protagonist
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((hero: BolHerosModel) => {
      if (hero) {
        this.spinner.show();
        this.subs?.unsubscribe();
        const actionService = this.heroService.quickUpdate(hero);
        this.subs = actionService.subscribe({
          next: (character: BolHerosModel) => {
            const questProtagonist = Object.assign({}, this.questProtagonist(), {protagonist: character});
            this.questProtagonist.set(questProtagonist);
            this.spinner.hide();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }
    });
  }
  deleteProtagonist(id: number, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer ce hero de l`aventure ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.subs?.unsubscribe();
        const actionService = this.questService.deleteProtagonistToQuest(id);
        this.subs = actionService.subscribe({
          next: (result: BolQuestProtagonistModel) => {
            this.spinner.hide();
            this.deleted.emit();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      },
    });
  }
}
