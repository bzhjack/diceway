import {ChangeDetectionStrategy, Component, computed, inject, signal, viewChild} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {of, switchMap} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {BolScenarioService} from '../services/bol-scenario.service';
import {BolDicePanelComponent} from './bol-dice-panel/bol-dice-panel';

interface CombatHero {
  readonly id: string;
  readonly nom: string;
  readonly joueur: string | null;
  vitalite: number;
  readonly vitaliteMax: number;
  heroisme: number;
}

interface CombatAntagonist {
  readonly id: string;
  readonly type: 'creature' | 'demon' | 'pnj';
  readonly nom: string;
  readonly surnom: string | null;
  readonly vitaliteMax: number;
  readonly defense: number;
  readonly rollAttaque: number;
  readonly rollInitiative: number;
  readonly degats: string | null;
  vitalite: number;
  eliminated: boolean;
}

interface InitiativeSlot {
  readonly id: string;
  readonly nom: string;
  readonly type: 'hero' | 'creature' | 'demon' | 'pnj';
}

@Component({
  selector: 'app-session-live-page',
  imports: [RouterLink, ButtonModule, CardModule, TagModule, BolDicePanelComponent],
  templateUrl: './session-live-page.html',
  styleUrl: './session-live-page.scss',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionLivePageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly dicePanel = viewChild(BolDicePanelComponent);

  protected readonly combatMode = signal(false);

  protected readonly scenario = toSignal(
    this.route.queryParamMap.pipe(
      switchMap((params) => {
        const id = params.get('scenarioId');
        return id ? this.scenarioService.scenario(id) : of(null);
      }),
    ),
  );

  protected readonly combatHeroes = signal<CombatHero[]>([]);
  protected readonly combatAntagonists = signal<CombatAntagonist[]>([]);
  protected readonly initiativeOrder = signal<InitiativeSlot[]>([]);

  protected readonly aliveAntagonists = computed(() =>
    this.combatAntagonists().filter((a) => !a.eliminated),
  );

  protected startCombat(): void {
    const s = this.scenario();
    if (!s) return;

    const heroes: CombatHero[] = (s.pj ?? []).map((pj) => ({
      id: String(pj.id),
      nom: pj.heros?.origines.nom ?? 'Héros',
      joueur: pj.heros?.origines.joueur ?? null,
      vitalite: 10,
      vitaliteMax: 10,
      heroisme: 3,
    }));

    const antagonists: CombatAntagonist[] = [
      ...(s.creatures ?? []).map((c): CombatAntagonist => ({
        id: `creature-${c.id}`,
        type: 'creature',
        nom: c.surnom ?? c.nom,
        surnom: c.surnom,
        vitaliteMax: c.vitalite_max,
        vitalite: c.vitalite_max,
        defense: c.defense,
        rollAttaque: c.agilite + c.attaque,
        rollInitiative: c.esprit,
        degats: c.degats,
        eliminated: false,
      })),
      ...(s.demons ?? []).map((d): CombatAntagonist => ({
        id: `demon-${d.id}`,
        type: 'demon',
        nom: d.surnom ?? d.nom,
        surnom: d.surnom,
        vitaliteMax: d.vitalite_max,
        vitalite: d.vitalite_max,
        defense: d.defense,
        rollAttaque: d.agilite + d.melee,
        rollInitiative: d.esprit,
        degats: d.degats,
        eliminated: false,
      })),
      ...(s.pnjs ?? []).map((p): CombatAntagonist => ({
        id: `pnj-${p.id}`,
        type: 'pnj',
        nom: p.surnom ?? p.nom,
        surnom: p.surnom,
        vitaliteMax: p.vitalite_max,
        vitalite: p.vitalite_max,
        defense: p.defense,
        rollAttaque: p.agilite + p.melee,
        rollInitiative: p.esprit,
        degats: p.armes?.[0]?.degats ?? null,
        eliminated: false,
      })),
    ];

    this.combatHeroes.set(heroes);
    this.combatAntagonists.set(antagonists);
    this.initiativeOrder.set([
      ...heroes.map((h): InitiativeSlot => ({id: h.id, nom: h.nom, type: 'hero'})),
      ...antagonists.map((a): InitiativeSlot => ({id: a.id, nom: a.nom, type: a.type})),
    ]);
    this.combatMode.set(true);
  }

  protected stopCombat(): void {
    this.combatMode.set(false);
    this.combatHeroes.set([]);
    this.combatAntagonists.set([]);
    this.initiativeOrder.set([]);
  }

  protected adjustHeroHp(id: string, delta: number): void {
    this.combatHeroes.update((list) =>
      list.map((h) =>
        h.id === id ? {...h, vitalite: Math.max(0, Math.min(h.vitaliteMax, h.vitalite + delta))} : h,
      ),
    );
  }

  protected adjustHeroHeroisme(id: string, delta: number): void {
    this.combatHeroes.update((list) =>
      list.map((h) => (h.id === id ? {...h, heroisme: Math.max(0, h.heroisme + delta)} : h)),
    );
  }

  protected adjustAntagonistHp(id: string, delta: number): void {
    this.combatAntagonists.update((list) =>
      list.map((a) =>
        a.id === id ? {...a, vitalite: Math.max(0, Math.min(a.vitaliteMax, a.vitalite + delta))} : a,
      ),
    );
  }

  protected eliminateAntagonist(id: string): void {
    this.combatAntagonists.update((list) =>
      list.map((a) => (a.id === id ? {...a, eliminated: true} : a)),
    );
    this.initiativeOrder.update((list) => list.filter((slot) => slot.id !== id));
  }

  protected moveInitiative(index: number, direction: -1 | 1): void {
    const target = index + direction;
    const list = this.initiativeOrder();
    if (target < 0 || target >= list.length) return;
    const updated = [...list];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    this.initiativeOrder.set(updated);
  }

  protected quickRollHero(hero: CombatHero, type: 'initiative' | 'attaque'): void {
    const label = type === 'initiative' ? `Initiative — ${hero.nom}` : `Attaque — ${hero.nom}`;
    this.dicePanel()?.configureRoll(0, label);
  }

  protected quickRollAntagonist(ant: CombatAntagonist, type: 'initiative' | 'attaque'): void {
    const modifier = type === 'initiative' ? ant.rollInitiative : ant.rollAttaque;
    const label = type === 'initiative' ? `Initiative — ${ant.nom}` : `Attaque — ${ant.nom}`;
    this.dicePanel()?.configureRoll(modifier, label);
  }

  protected vitalitePercent(current: number, max: number): number {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  }
}
