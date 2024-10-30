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
import {BolActionComponent} from "../../quest/action/action.component";
import {KnobModule} from "primeng/knob";
import {InlineSVGModule} from "ng-inline-svg-2";
import {InputNumberModule} from "primeng/inputnumber";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {SkeletonModule} from "primeng/skeleton";
import {FormsModule} from "@angular/forms";
import {OverlayPanel} from "primeng/overlaypanel/overlaypanel";
import {BolQuestProtagonistModel} from "../../models/bol-quest.model";
import {BolQuestService} from "../../services/bol-quest.service";
import {BolPnjCreateComponent} from "../create/create.component";

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
    KnobModule,
    InlineSVGModule,
    InputNumberModule,
    OverlayPanelModule,
    SkeletonModule,
    FormsModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class BolQuestPnjCardComponent {
  private pnjService = inject(BolHerosService);
  private dialogService = inject(DialogService);
  private spinner = inject(NgxSpinnerService);
  private questService = inject(BolQuestService);

  private ref?: DynamicDialogRef;
  private subs?: Subscription;
  ressources = {
    vitalite: 0,
    heroisme: 0,
    vilenie: 0
  }
  questProtagonistId = input<number>(0);
  questProtagonist = signal<BolQuestProtagonistModel | null>(null);
  pnj= signal<BolHerosModel | null>(null);

  questProtagonist$ = toObservable<number>(this.questProtagonistId).pipe( // Watch for user changes
    filter((id) => id > 0),                     // Only make http request for users larger than 0
    tap((id) => this.questProtagonist.set(null)),    // Just some debugging
    exhaustMap((id) =>                          // Don't execute the http request if one is already in progress
      this.questService.questProtagonist(id).pipe(tap((questProtagonist) => {
        this.questProtagonist.set(questProtagonist);
        this.pnj.set(questProtagonist.protagonist as BolHerosModel);
      }))   // Update the response
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
        hero: this.questProtagonist()?.protagonist
      }
    });
  }

  openResources(panel: OverlayPanel, event: any) {
    panel.toggle(event);
    this.ressources.heroisme = Number(this.questProtagonist()?.heroisme ?? 0);
    this.ressources.vitalite = Number(this.questProtagonist()?.vitalite ?? 0);
    this.ressources.vilenie = Number(this.questProtagonist()?.vilenie ?? 0);
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
    this.ref = this.dialogService.open(BolPnjCreateComponent, {
      header: 'Fiche de personnage non joueur',
      data: {
        pnj: this.questProtagonist()?.protagonist
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((pnj: BolHerosModel) => {
      if (pnj) {
        this.spinner.show();
        this.subs?.unsubscribe();
        const actionService = this.pnjService.quickUpdate(pnj);
        this.subs = actionService.subscribe({
          next: (character: BolHerosModel) => {
            this.pnj.set(Object.assign({}, this.pnj(), character));
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
