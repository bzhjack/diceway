import {Component, inject, input, Signal, signal} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {HeaderComponent} from "../../../shared/header/header.component";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {BolHerosService} from "../../services/bol-heros.service";
import {DialogService} from "primeng/dynamicdialog";
import {BolHerosModel} from "../../models/bol-heros.model";
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {exhaustMap, filter, map, Subscription} from "rxjs";
import {tap} from "rxjs/operators";
import {BolQuestService} from "../../services/bol-quest.service";
import {BolQuestModel} from "../../models/bol-quest.model";
import {AsyncPipe, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {PaginatorModule} from "primeng/paginator";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgxSpinnerService} from "ngx-spinner";

@Component({
  selector: 'bol-quest',
  standalone: true,
  imports: [
    ButtonDirective,
    HeaderComponent,
    RouterLink,
    AsyncPipe,
    OverlayPanelModule,
    Button,
    InputTextModule,
    InputTextareaModule,
    NgIf,
    PaginatorModule,
    ReactiveFormsModule
  ],
  templateUrl: './quest.component.html',
  styleUrl: './quest.component.scss'
})
export class BolQuestComponent {
  questService = inject(BolQuestService);
  route = inject(ActivatedRoute);
  fb = inject(FormBuilder);

  private spinner = inject(NgxSpinnerService);
  private subs?: Subscription;
  public idCtrl: FormControl<string | null> = new FormControl(null);
  public titreCtrl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  public commentaireCtrl = new FormControl('', [Validators.minLength(3)]);
  public questForm = this.fb.group({id: this.idCtrl, titre: this.titreCtrl, commentaire: this.commentaireCtrl});
  // Garantir que 'undefined' est converti en 'null'
  questId: Signal<string | null | undefined> = toSignal(this.route.paramMap.pipe(
    map(params => params.get('id'))
  ));

  quest = signal<BolQuestModel | null>(null);

  quest$ = toObservable<string | null | undefined>(this.questId).pipe(
    filter((id): id is string => id !== null),  // Type guard pour éliminer 'null'
    tap(() => this.quest.set(null)),  // Réinitialise la quête lors de chaque changement d'ID
    exhaustMap((id) =>
      this.questService.quest(id).pipe(
        tap((quest: BolQuestModel) => {
          this.quest.set(quest);
          this.questForm.setValue(quest);
        })  // Met à jour la quête avec la réponse HTTP
      )
    )
  );
  onError(controlName: string) {
    const control = this.questForm.get(controlName);
    return control?.dirty && control.invalid;
  }
  updateQuest() {
    if (this.questForm.valid) {
      const quest = this.questForm.value;
      this.subs?.unsubscribe();
      this.subs = this.questService.updateQuest(this.questForm.value as BolQuestModel).subscribe({
        next: (quest: BolQuestModel) => {
          this.spinner.hide();
        },
        error: () => {
          this.spinner.hide();
        }
      });
    }
  }
}
