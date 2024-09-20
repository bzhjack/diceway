import {Component, computed, inject, input, output} from '@angular/core';
import {CardModule} from "primeng/card";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {TagModule} from "primeng/tag";
import {FieldsetModule} from "primeng/fieldset";
import {NgForOf, NgIf} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";
import {ButtonDirective} from "primeng/button";
import {Ripple} from "primeng/ripple";
import {ConfirmPopupModule} from "primeng/confirmpopup";
import {ConfirmationService} from "primeng/api";

@Component({
  selector: 'bol-creature-card',
  standalone: true,
  imports: [
    CardModule,
    TagModule,
    FieldsetModule,
    NgForOf,
    NgIf,
    TooltipModule,
    ButtonDirective,
    Ripple,
    ConfirmPopupModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class BolCreatureCardComponent {
  private confirmationService = inject(ConfirmationService);
  creature = input.required<BolCreatureModel>()
  profile = computed(() => this.creature()?.user_id ? 'private' : 'public')
  editCreature = output<BolCreatureModel>()
  deleteCreature = output<BolCreatureModel>()

  getSeverity(creature: BolCreatureModel) {
    switch (creature?.user_id) {
      case null:
        return 'success';
      default:
        return 'info';
    }
  };

  onCreate(creature: BolCreatureModel) {
    this.editCreature.emit(<BolCreatureModel>creature);
  }

  onDelete(creature: BolCreatureModel, event: any) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Voulez vous supprimer cette créature ?',
      icon: 'pi pi-info-circle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      acceptLabel: "Oui",
      rejectLabel: "Non",
      accept: () => {
        this.deleteCreature.emit(<BolCreatureModel>creature);
      },
    });
  }

}
