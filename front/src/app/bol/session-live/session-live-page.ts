import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {of, switchMap} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {BolScenarioService} from '../services/bol-scenario.service';
import {BolCombatPanelComponent, InitiativeSlot} from './bol-combat-panel/bol-combat-panel';

@Component({
  selector: 'app-session-live-page',
  imports: [RouterLink, ButtonModule, CardModule, TagModule, BolCombatPanelComponent],
  templateUrl: './session-live-page.html',
  styleUrl: './session-live-page.scss',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLivePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly scenarioService = inject(BolScenarioService);

  protected readonly combatMode = signal(false);
  protected readonly combatParticipants = signal<InitiativeSlot[]>([]);

  protected readonly scenario = toSignal(
    this.route.queryParamMap.pipe(
      switchMap((params) => {
        const id = params.get('scenarioId');
        return id ? this.scenarioService.scenario(id) : of(null);
      }),
    ),
  );

  protected startCombat(): void {
    const s = this.scenario();
    if (!s) return;

    const all: InitiativeSlot[] = [
      ...(s.pj ?? []).map((pj): InitiativeSlot => ({
        id: `hero-${pj.id}`,
        nom: pj.heros?.origines.nom ?? 'Héros',
        avatar: pj.heros?.origines.avatar ?? null,
        type: 'hero',
        vitaliteMax: pj.heros?.ressources?.vitalite ?? 0,
        vitaliteCourante: pj.heros?.ressources?.vitalite ?? 0,
        defense: pj.heros?.combat?.defense ?? null,
        degats: null,
        tags: [],
        category: null,
      })),
      ...(s.creatures ?? []).map((c): InitiativeSlot => ({
        id: `creature-${c.id}`,
        nom: c.surnom ?? c.nom,
        avatar: c.creature?.avatar ?? null,
        type: 'creature',
        vitaliteMax: c.vitalite_max,
        vitaliteCourante: c.vitalite_max,
        defense: c.defense,
        degats: c.degats,
        tags: (c.capacites ?? []).map((cap) => cap.capacite ?? '').filter(Boolean),
        category: c.rang,
      })),
      ...(s.demons ?? []).map((d): InitiativeSlot => ({
        id: `demon-${d.id}`,
        nom: d.surnom ?? d.nom,
        avatar: d.demon?.avatar ?? null,
        type: 'demon',
        vitaliteMax: d.vitalite_max,
        vitaliteCourante: d.vitalite_max,
        defense: d.defense,
        degats: d.degats,
        tags: (d.pouvoirs ?? []).map((p) => p.pouvoir ?? '').filter(Boolean),
        category: d.rang,
      })),
      ...(s.pnjs ?? []).map((p): InitiativeSlot => ({
        id: `pnj-${p.id}`,
        nom: p.surnom ?? p.nom,
        avatar: p.pnj?.origines?.avatar ?? null,
        type: 'pnj',
        vitaliteMax: p.vitalite_max,
        vitaliteCourante: p.vitalite_max,
        defense: p.defense,
        degats: null,
        tags: (p.armes ?? [])
          .filter((a) => a.degats)
          .map((a) => (a.nom ? `${a.nom} ${a.degats}` : (a.degats ?? ''))),
        category: p.rang,
      })),
    ];

    this.combatParticipants.set(all);
    this.combatMode.set(true);
  }

  protected stopCombat(): void {
    this.combatMode.set(false);
    this.combatParticipants.set([]);
  }
}
