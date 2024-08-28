import {Component, effect, input} from '@angular/core';
import {CardModule} from "primeng/card";
import {BolCreatureModel} from "../../models/bol-creature.model";
import {TagModule} from "primeng/tag";
import {FieldsetModule} from "primeng/fieldset";
import {NgForOf, NgIf} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";

@Component({
  selector: 'bol-creature-card',
  standalone: true,
  imports: [
    CardModule,
    TagModule,
    FieldsetModule,
    NgForOf,
    NgIf,
    TooltipModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class BolCreatureCardComponent {
  creature = input<BolCreatureModel>()
  constructor() {
    effect(() => {
      console.log(this.creature());
    });
  }
}
