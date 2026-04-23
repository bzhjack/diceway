import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {RouterLink} from '@angular/router';
import {Subject} from 'rxjs';
import {switchMap, startWith} from 'rxjs/operators';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {InputTextModule} from 'primeng/inputtext';
import {TagModule} from 'primeng/tag';
import {ConfirmationService} from 'primeng/api';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {BolScenarioService} from '../services/bol-scenario.service';
import {BolScenarioModel} from '../models/bol-scenario.model';

@Component({
  selector: 'app-scenario-library-page',
  imports: [
    RouterLink,
    ButtonModule,
    CardModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './scenario-library-page.html',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioLibraryPageComponent {
  private readonly scenarioService = inject(BolScenarioService);
  private readonly confirmationService = inject(ConfirmationService);

  private readonly refresh$ = new Subject<void>();
  private readonly scenarios$ = this.refresh$.pipe(
    startWith(undefined),
    switchMap(() => this.scenarioService.scenarios()),
  );
  private readonly scenarios = toSignal(this.scenarios$, {initialValue: [] as BolScenarioModel[]});

  protected readonly searchTerm = signal('');

  protected readonly filteredScenarios = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    return this.scenarios().filter(
      (s) =>
        !term ||
        s.titre.toLowerCase().includes(term) ||
        (s.pitch ?? '').toLowerCase().includes(term),
    );
  });

  protected pjNames(scenario: BolScenarioModel): string[] {
    return (scenario.pj ?? []).map((p) => p.heros?.origines.nom ?? '?').filter(Boolean);
  }

  protected confirmDelete(scenario: BolScenarioModel): void {
    this.confirmationService.confirm({
      message: `Supprimer le scénario « ${scenario.titre} » ?`,
      header: 'Confirmer la suppression',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.scenarioService.delete(scenario.id!).subscribe(() => this.refresh$.next());
      },
    });
  }
}
