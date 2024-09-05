import {Component, computed, inject, input, output} from '@angular/core';
import {ConfirmationService} from "primeng/api";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {BolHerosModel} from "../../models/bol-heros.model";
import {ButtonDirective} from "primeng/button";
import {CardModule} from "primeng/card";
import {FieldsetModule} from "primeng/fieldset";
import {NgForOf, NgIf} from "@angular/common";
import {Ripple} from "primeng/ripple";
import {TagModule} from "primeng/tag";
import {TooltipModule} from "primeng/tooltip";

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
    TooltipModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class BolPnjCardComponent {
  private confirmationService = inject(ConfirmationService);
  pnj = input.required<BolHerosModel | any>()
  profile = computed(() => this.pnj()?.user_id ? 'private' : 'public')
  editPnj = output<BolHerosModel>()
  deletePnj = output<BolHerosModel>()

  getSeverity (pnj: BolHerosModel) {
    switch (pnj?.user_id) {
      case null:
        return 'success';
      default:
        return 'info';
    }
  }
  getType(pnj: BolHerosModel) {
    switch (pnj?.type) {
      case 'C':
        return 'Coriaces';
      case 'R':
        return 'Rivaux';
      case 'P':
        return 'Piétaille';
    }
    return '';
  }
  onCreate(pnj: BolHerosModel) {
    this.editPnj.emit(<BolHerosModel>pnj);
  }
  onDelete(pnj: BolHerosModel, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cet personnage ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.deletePnj.emit(<BolHerosModel>pnj);
      },
    });
  }
}
