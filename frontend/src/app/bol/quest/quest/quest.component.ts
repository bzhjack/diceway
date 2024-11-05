import {Component, computed, inject, output, Signal, ViewChild} from '@angular/core';
import {Button, ButtonDirective} from "primeng/button";
import {HeaderComponent} from "../../../shared/header/header.component";
import {ActivatedRoute, RouterLink} from "@angular/router";
import {toObservable, toSignal} from "@angular/core/rxjs-interop";
import {BehaviorSubject, exhaustMap, filter, map, Subscription} from "rxjs";
import {tap} from "rxjs/operators";
import {BolQuestService} from "../../services/bol-quest.service";
import {BolQuestModel} from "../../models/bol-quest.model";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {InputTextModule} from "primeng/inputtext";
import {InputTextareaModule} from "primeng/inputtextarea";
import {PaginatorModule} from "primeng/paginator";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgxSpinnerService} from "ngx-spinner";
import {Table} from "primeng/table";
import {BolQuestStateService} from '../../services/bol-quest-state.service';
import {Overlay} from 'primeng/overlay';
import {FieldsetModule} from "primeng/fieldset";
import {ConfirmationService} from "primeng/api";
import {BolQuestHerosCardComponent} from "../../heros/quest-card/card.component";
import {BolQuestPnjCardComponent} from "../../pnj/quest-card/card.component";
import {BolQuestCreatureCardComponent} from "../../creatures/quest-card/card.component";

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
    ReactiveFormsModule,
    FieldsetModule,
    BolQuestHerosCardComponent,
    NgForOf,
    BolQuestPnjCardComponent,
    BolQuestCreatureCardComponent
  ],
  templateUrl: './quest.component.html',
  styleUrl: './quest.component.scss',
  providers: [ConfirmationService]
})
export class BolQuestComponent {
  questService = inject(BolQuestService);
  questStateService = inject(BolQuestStateService);

  route = inject(ActivatedRoute);
  fb = inject(FormBuilder);

  @ViewChild('questTable') questTable?: Table;
  @ViewChild('titrePanel') titrePanel?: Overlay;

  private spinner = inject(NgxSpinnerService);
  private subs?: Subscription;
  public idCtrl: FormControl<string | null> = new FormControl(null);
  public titreCtrl = new FormControl('', [Validators.required, Validators.minLength(3)]);
  public commentaireCtrl = new FormControl('', [Validators.minLength(3)]);
  public questForm = this.fb.group({id: this.idCtrl, titre: this.titreCtrl, commentaire: this.commentaireCtrl});

  // Garantir que 'undefined' est converti en 'null'
  questId: Signal<string | undefined> = toSignal(this.route.paramMap.pipe(
    map(params => params.get('id') || undefined)
  ));

  quest = computed(() => this.questStateService.questState());
  heros = computed(() =>  this.quest()?.protagonists.filter((protagonist) => protagonist.type === 'H'));
  demons = computed(() =>  this.quest()?.protagonists.filter((protagonist) => protagonist.type === 'D'));
  pnjs = computed(() =>  this.quest()?.protagonists.filter((protagonist) => protagonist.type === 'P'));
  creatures = computed(() =>  this.quest()?.protagonists.filter((protagonist) => protagonist.type === 'C'));


  questId$ = new BehaviorSubject<string | null | undefined>(this.questId());
  quest$ = this.questId$.pipe(
    filter((id): id is string => id !== null),
    tap(() => {
      this.spinner.show();
      //this.questStateService.questState.set(null);
    }),
    exhaustMap((id) =>
      this.questService.quest(id).pipe(
        tap((quest: BolQuestModel) => {
          this.spinner.hide();
          this.majForm(quest);
        }),
        tap({
          error: () => {
            this.spinner.hide();
          }
        })
      )
    )
  );

  onError(controlName: string) {
    const control = this.questForm.get(controlName);
    return control?.dirty && control.invalid;
  }
  updateQuest() {
    if (this.questForm.valid) {
      this.spinner.show();
      const quest = this.questForm.value;
      this.subs?.unsubscribe();
      this.subs = this.questService.updateQuest(this.questForm.value as BolQuestModel).subscribe({
        next: (quest: BolQuestModel) => {
          this.spinner.hide();
          this.majForm(quest);
          this.titrePanel?.hide();
        },
        error: () => {
          this.titrePanel?.hide();
          this.spinner.hide();
        }
      });
    }
  }
  majForm(quest: BolQuestModel) {
    this.questForm.patchValue(quest);
    this.questStateService.questState.set(quest);
  }
  refreshQuest() {
    this.questId$.next(this.questId$.value);
  }
}
