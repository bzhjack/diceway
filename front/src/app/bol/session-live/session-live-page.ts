import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {of, switchMap} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {BolScenarioService} from '../services/bol-scenario.service';

@Component({
  selector: 'app-session-live-page',
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  templateUrl: './session-live-page.html',
  styleUrl: './session-live-page.scss',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLivePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly scenarioService = inject(BolScenarioService);

  protected readonly combatMode = signal(false);

  protected readonly scenario = toSignal(
    this.route.queryParamMap.pipe(
      switchMap((params) => {
        const id = params.get('scenarioId');
        return id ? this.scenarioService.scenario(id) : of(null);
      }),
    ),
  );
}
