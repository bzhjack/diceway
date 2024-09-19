import { Component, inject } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { BolDemonsService } from '../../services/bol-demons.service';
import { DialogService } from 'primeng/dynamicdialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';

@Component({
  selector: 'bol-demon-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [
    ConfirmationService
  ],
})
export class BolDemonHomeComponent {
  private confirmationService = inject(ConfirmationService);
  private demonService = inject(BolDemonsService);
  readonly #ds = inject(DialogService);
  private spinner = inject(NgxSpinnerService);
  private subsDemon?: Subscription;
  public demons: Array<any> = [];
  public filteredDemons: Array<any> = [];

  constructor() {
    this.getDemons();
  }

  getDemons() {
    this.spinner.show();
    this.subsDemon?.unsubscribe();

    // Supposons que `hs.heroes()` et `hs.anotherRequest()` sont les deux requêtes HTTP que vous souhaitez lancer en parallèle
    const creaturesRequest = this.demonService.demons();

    this.subsDemon = creaturesRequest.subscribe({
      next: (demons) => {
        this.demons = demons;
        this.filteredDemons = demons;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      }
    });
  }

}
