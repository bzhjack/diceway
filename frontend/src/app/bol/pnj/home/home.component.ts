import {Component, inject} from '@angular/core';
import {ButtonDirective} from "primeng/button";
import {DropdownModule} from "primeng/dropdown";
import {FormsModule} from "@angular/forms";
import {HeaderComponent} from "../../../shared/header/header.component";
import {InputTextModule} from "primeng/inputtext";
import {RouterLink} from "@angular/router";
import {BolPnjCreateComponent} from "../create/create.component";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {BolCreatureCreateComponent} from "../../creatures/create/create.component";
import {DialogService, DynamicDialogRef} from "primeng/dynamicdialog";
import {Subscription} from "rxjs";
import {NgxSpinnerService} from "ngx-spinner";
import {BolHerosModel} from "../../models/bol-heros.model";

@Component({
  selector: 'bol-pnj-home',
  standalone: true,
  imports: [
    ButtonDirective,
    DropdownModule,
    FormsModule,
    HeaderComponent,
    InputTextModule,
    RouterLink,
    BolPnjCreateComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolPnjHomeComponent {

  private spinner = inject(NgxSpinnerService);
  readonly #ds = inject(DialogService);
  private subs: Subscription | undefined;
  private ref?: DynamicDialogRef;

  createPnj(creature?: BolCreatureModel) {
    this.ref = this.#ds.open(BolPnjCreateComponent, {
      header: creature ? 'Modification d\'une créature' : 'Création d\'une créature',
      data: {
        creature: creature
      }
    });
    this.subs?.unsubscribe();
    this.subs = this.ref.onClose.subscribe((pnj: BolHerosModel) => {
      /*if (creature) {
        this.spinner.show();
        this.subs?.unsubscribe();
        const actionService = creature.id ? this.creatureService.updateCreature(creature) : this.creatureService.createCreature(creature);
        this.subs = actionService.subscribe({
          next: () => {
            this.spinner.hide();
            this.getBestiary();
          },
          error: () => {
            this.spinner.hide();
          }
        });
      }*/
    });
  }
}
