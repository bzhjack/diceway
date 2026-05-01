import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {of, switchMap} from 'rxjs';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {BolScenarioService} from '../services/bol-scenario.service';
import {BolCombatPanelComponent, DamageCategorie, InitiativeSlot} from './bol-combat-panel/bol-combat-panel';

function categorieFromDegats(degats: string | null): DamageCategorie | null {
  if (!degats) return null;
  if (degats.startsWith('d3'))  return 'nue';
  if (degats.startsWith('d6M')) return 'legere';
  if (degats.startsWith('d6B')) return 'lourde';
  if (degats.startsWith('d6'))  return 'moyenne';
  return null;
}

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
        heroismMax: pj.heros?.ressources?.heroisme ?? null,
        heroismCourant: pj.heros?.ressources?.heroisme ?? null,
        vigueur: pj.heros?.attributs?.vigueur ?? null,
        agilite: pj.heros?.attributs?.agilite ?? null,
        esprit: pj.heros?.attributs?.esprit ?? null,
        initiative: pj.heros?.combat?.initiative ?? null,
        melee: pj.heros?.combat?.melee ?? null,
        tir: pj.heros?.combat?.tir ?? null,
        defense: pj.heros?.combat?.defense ?? null,
        degats: null,
        tags: [],
        pouvoirs: [],
        armesList: (pj.heros?.armes ?? [])
          .filter((a) => a.arme)
          .map((a) => ({
            nom: a.arme!.arme,
            degats: a.arme!.degats,
            type: a.arme!.type,
            portee: a.arme!.portee,
            notes: a.arme!.notes,
            categorie: categorieFromDegats(a.arme!.degats),
          })),
        armures: (pj.heros?.armures ?? [])
          .filter((a) => a.armure)
          .map((a) => ({
            nom: a.armure!.armure,
            protection: a.armure!.protection,
            malus: a.armure!.malus,
          })),
        category: null,
      })),
      ...(s.creatures ?? []).map((c): InitiativeSlot => ({
        id: `creature-${c.id}`,
        nom: c.surnom ?? c.nom,
        avatar: c.creature?.avatar ?? null,
        type: 'creature',
        vitaliteMax: c.vitalite_max,
        vitaliteCourante: c.vitalite_max,
        heroismMax: null,
        heroismCourant: null,
        vigueur: c.vigueur,
        agilite: c.agilite,
        esprit: c.esprit,
        initiative: null,
        melee: c.attaque,
        tir: null,
        defense: c.defense,
        degats: c.degats,
        tags: [
          ...(c.capacites ?? []).map((cap) => cap.capacite ?? '').filter(Boolean),
        ],
        pouvoirs: [],
        armesList: [],
        armures: c.protection ? [{nom: 'Protection naturelle', protection: c.protection, malus: null}] : [],
        category: c.rang,
      })),
      ...(s.demons ?? []).map((d): InitiativeSlot => {
        const armorPowers: {nom: string; protection: string | null; malus: string | null}[] = [];
        const pouvoirs = (d.pouvoirs ?? []).filter((p) => p.pouvoir);
        if (pouvoirs.some((p) => p.pouvoir === 'Armure')) armorPowers.push({nom: 'Armure', protection: 'd6-2 (2)', malus: null});
        if (pouvoirs.some((p) => p.pouvoir === 'Cuirassé')) armorPowers.push({nom: 'Cuirassé', protection: 'd6 (4)', malus: null});
        return {
          id: `demon-${d.id}`,
          nom: d.surnom ?? d.nom,
          avatar: d.demon?.avatar ?? null,
          type: 'demon',
          vitaliteMax: d.vitalite_max,
          vitaliteCourante: d.vitalite_max,
          heroismMax: null,
          heroismCourant: null,
          vigueur: d.vigueur,
          agilite: d.agilite,
          esprit: d.esprit,
          initiative: null,
          melee: d.melee,
          tir: d.tir,
          defense: d.defense,
          degats: d.degats,
          tags: [],
          pouvoirs: pouvoirs
            .filter((p) => p.pouvoir !== 'Armure' && p.pouvoir !== 'Cuirassé')
            .map((p) => ({
              nom: p.pouvoir!,
              avantage_attaque: p.avantage_attaque ?? false,
              degats_superieurs: p.degats_superieurs ?? false,
              regeneration: p.regeneration ?? false,
              intangible: p.intangible ?? false,
              avertissement_combat: p.avertissement_combat ?? false,
            })),
          armesList: [],
          armures: armorPowers,
          category: d.rang,
        };
      }),
      ...(s.pnjs ?? []).map((p): InitiativeSlot => ({
        id: `pnj-${p.id}`,
        nom: p.surnom ?? p.nom,
        avatar: p.pnj?.origines?.avatar ?? null,
        type: 'pnj',
        vitaliteMax: p.vitalite_max,
        vitaliteCourante: p.vitalite_max,
        heroismMax: null,
        heroismCourant: null,
        vigueur: p.vigueur,
        agilite: p.agilite,
        esprit: p.esprit,
        initiative: null,
        melee: p.melee,
        tir: p.tir,
        defense: p.defense,
        degats: null,
        tags: [],
        pouvoirs: [],
        armesList: (p.armes ?? [])
          .filter((a) => a.nom || a.degats)
          .map((a) => ({
            nom: a.nom ?? '',
            degats: a.degats,
            type: a.type,
            portee: null,
            notes: null,
            categorie: categorieFromDegats(a.degats),
          })),
        armures: [],
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
