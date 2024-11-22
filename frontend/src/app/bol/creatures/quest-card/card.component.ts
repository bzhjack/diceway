import {Component, computed, inject, input, output, signal} from '@angular/core';
import {CardModule} from "primeng/card";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {TagModule} from "primeng/tag";
import {AsyncPipe, JsonPipe, NgIf} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";
import {Button, ButtonDirective} from "primeng/button";
import {Ripple} from "primeng/ripple";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ConfirmationService} from "primeng/api";
import {BolQuestProtagonistModel} from "../../models/bol-quest.model";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {NgxSpinnerService} from "ngx-spinner";
import {BolQuestService} from "../../services/bol-quest.service";
import {exhaustMap, filter, Subscription} from "rxjs";
import {BolCreaturesService} from "../../services/bol-creatures.service";
import {toObservable} from "@angular/core/rxjs-interop";
import {tap} from "rxjs/operators";
import {OverlayPanel, OverlayPanelModule} from "primeng/overlaypanel";
import {BolCreatureCreateComponent} from "../create/create.component";
import {BtnComponent} from "../../../shared/btn/btn.component";
import {InlineSVGModule} from "ng-inline-svg-2";
import {InputNumberModule} from "primeng/inputnumber";
import {SkeletonModule} from "primeng/skeleton";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BolActionComponent} from "../../quest/action/action.component";
import {InputTextModule} from "primeng/inputtext";
import {BadgeModule} from "primeng/badge";

@Component({
  selector: 'bol-creature-card',
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
    InputNumberModule,
    ConfirmPopupModule,
    BadgeModule
  ],
  templateUrl: './card.component.html',
  standalone: true,
  styleUrl: './card.component.scss'
})
export class BolQuestCreatureCardComponent {

  private creatureService = inject(BolCreaturesService);
  private dialogService = inject(DialogService);
  private spinner = inject(NgxSpinnerService);
  private questService = inject(BolQuestService);
  private confirmationService = inject(ConfirmationService);

  private ref?: DynamicDialogRef;
  private subs?: Subscription;

  ressources = {
    vitalite: 0,
  }
  deleted = output();
  questProtagonistId = input<number>(0);
  questProtagonist = signal<BolQuestProtagonistModel | null>(null);
  creature= computed(() => this.questProtagonist()?.protagonist as BolCreatureModel);

  questProtagonist$ = toObservable<number>(this.questProtagonistId).pipe( // Watch for user changes
    filter((id) => id > 0),                     // Only make http request for users larger than 0
    tap((id) => this.questProtagonist.set(null)),    // Just some debugging
    exhaustMap((id) =>                          // Don't execute the http request if one is already in progress
      this.questService.questProtagonist(id).pipe(tap((questProtagonist) => {
        this.questProtagonist.set(questProtagonist);
      }))
    )
  );
  openResources(panel: OverlayPanel, event: any) {
    panel.toggle(event);
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
    this.ref = this.dialogService.open(BolCreatureCreateComponent, {
      header: 'Fiche de créature',
      data: {
        creature: this.questProtagonist()?.protagonist
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((creature: BolCreatureModel) => {
      if (creature) {
        this.spinner.show();
        this.subs?.unsubscribe();
        const actionService = this.creatureService.updateCreature(creature);
        this.subs = actionService.subscribe({
          next: (creature: BolCreatureModel) => {
            const questProtagonist = Object.assign({}, this.questProtagonist(), {protagonist: creature});
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
      message: 'Voulez vous supprimer cette créature de l`aventure ?',
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
  getType(creature: BolCreatureModel | null) {
    switch (creature?.type) {
      case 'C':
        return 'Coriace';
      case 'R':
        return 'Rival';
      case 'P':
        return 'Piétaille';
    }
    return '';
  }

  getSeverity(creature: BolCreatureModel | null): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (creature?.type) {
      case 'C':
        return 'warning';
      case 'R':
        return 'danger';
      case 'P':
        return 'secondary';
    }
    return undefined;
  }
}
