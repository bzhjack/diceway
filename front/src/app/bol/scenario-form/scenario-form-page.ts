import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';
import {BolCreaturesService} from '../services/bol-creatures.service';
import {BolDemonsService} from '../services/bol-demons.service';
import {BolHerosService} from '../services/bol-heros.service';
import {BolScenarioService} from '../services/bol-scenario.service';

interface ScenarioPjDraft {
  readonly id: string;
  readonly heroId: string;
  readonly name: string;
  readonly joueur: string | null;
}

interface ScenarioCreatureDraft {
  readonly id: string;
  readonly creatureId: string;
  readonly surnom: string;
  readonly nom: string;
  readonly vitaliteMax: number;
}

interface ScenarioDemonDraft {
  readonly id: string;
  readonly demonId: string;
  readonly surnom: string;
  readonly nom: string;
  readonly vitaliteMax: number;
}

interface ScenarioPnjArme {
  readonly nom: string | null;
  readonly degats: string | null;
  readonly type: 'M' | 'T' | null;
}

interface ScenarioPnjDraft {
  readonly id: string;
  readonly pnjId: string;
  readonly surnom: string;
  readonly nom: string;
  readonly vitaliteMax: number;
  readonly armes: ScenarioPnjArme[];
}

@Component({
  selector: 'app-scenario-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    IftaLabelModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './scenario-form-page.html',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioFormPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly bolHerosService = inject(BolHerosService);
  private readonly bolCreaturesService = inject(BolCreaturesService);
  private readonly bolDemonsService = inject(BolDemonsService);
  private readonly scenarioService = inject(BolScenarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly heroes = toSignal(this.bolHerosService.heroes(), {initialValue: []});
  private readonly allCreatures = toSignal(this.bolCreaturesService.creatures(), {initialValue: []});
  private readonly allDemons = toSignal(this.bolDemonsService.demons(), {initialValue: []});
  private readonly allPnjs = toSignal(this.bolHerosService.pnjs(), {initialValue: []});

  protected readonly scenarioId = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly pj = signal<ScenarioPjDraft[]>([]);
  protected readonly creatures = signal<ScenarioCreatureDraft[]>([]);
  protected readonly demons = signal<ScenarioDemonDraft[]>([]);
  protected readonly pnjs = signal<ScenarioPnjDraft[]>([]);

  protected readonly heroOptions = computed(() =>
    this.heroes()
      .filter((h) => h.active)
      .map((h) => ({
        label: h.origines.nom ?? '(sans nom)',
        value: h.id as string,
      })),
  );

  protected readonly creatureOptions = computed(() =>
    this.allCreatures().map((c) => ({
      label: c.nom,
      value: c.id as string,
    })),
  );

  protected readonly demonOptions = computed(() =>
    this.allDemons().map((d) => ({
      label: d.nom,
      value: d.id as string,
    })),
  );

  protected readonly pnjOptions = computed(() =>
    this.allPnjs().map((p) => ({
      label: p.origines?.nom ?? '(sans nom)',
      value: p.id as string,
    })),
  );

  protected readonly scenarioForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    pitch: ['', [Validators.required, Validators.maxLength(240)]],
  });
  protected readonly pjForm = this.formBuilder.group({
    heroId: [null as string | null, [Validators.required]],
  });
  protected readonly creatureForm = this.formBuilder.nonNullable.group({
    creatureId: [null as string | null, [Validators.required]],
    surnom: ['', [Validators.maxLength(80)]],
  });
  protected readonly demonForm = this.formBuilder.nonNullable.group({
    demonId: [null as string | null, [Validators.required]],
    surnom: ['', [Validators.maxLength(80)]],
  });
  protected readonly pnjForm = this.formBuilder.nonNullable.group({
    pnjId: [null as string | null, [Validators.required]],
    surnom: ['', [Validators.maxLength(80)]],
  });

  protected readonly pageTitle = computed(() =>
    this.scenarioId() ? 'Modifier le scénario' : 'Nouveau scénario',
  );

  protected readonly scenarioSummary = computed(() => {
    const form = this.scenarioForm.getRawValue();
    return {
      title: form.title.trim() || 'Titre du scénario',
      pitch: form.pitch.trim() || 'Ajoute une accroche pour poser la promesse de jeu.',
    };
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.scenarioId.set(id);
      this.scenarioService.scenario(id).subscribe((scenario) => {
        this.scenarioForm.setValue({
          title: scenario.titre,
          pitch: scenario.pitch ?? '',
        });
        this.pj.set(
          (scenario.pj ?? []).map((p) => ({
            id: this.createDraftId('pj'),
            heroId: p.heros_id,
            name: p.heros?.origines.nom ?? '?',
            joueur: p.heros?.origines.joueur ?? null,
          })),
        );
        this.creatures.set(
          (scenario.creatures ?? []).map((c) => ({
            id: this.createDraftId('creature'),
            creatureId: c.creature_id ?? '',
            surnom: c.surnom ?? '',
            nom: c.nom,
            vitaliteMax: c.vitalite_max,
          })),
        );
        this.demons.set(
          (scenario.demons ?? []).map((d) => ({
            id: this.createDraftId('demon'),
            demonId: d.demon_id ?? '',
            surnom: d.surnom ?? '',
            nom: d.nom,
            vitaliteMax: d.vitalite_max,
          })),
        );
        this.pnjs.set(
          (scenario.pnjs ?? []).map((p) => ({
            id: this.createDraftId('pnj'),
            pnjId: p.pnj_id ?? '',
            surnom: p.surnom ?? '',
            nom: p.nom,
            vitaliteMax: p.vitalite_max,
            armes: p.armes ?? [],
          })),
        );
      });
    }
  }

  protected addPj(): void {
    this.errorMessage.set(null);
    if (this.pjForm.invalid) {
      this.pjForm.markAllAsTouched();
      return;
    }
    const heroId = this.pjForm.getRawValue().heroId!;
    const hero = this.heroes().find((h) => h.id === heroId);
    if (!hero) return;
    if (this.pj().some((p) => p.heroId === heroId)) {
      this.errorMessage.set('Ce personnage est déjà dans la liste.');
      return;
    }
    this.pj.update((entries) => [
      ...entries,
      {
        id: this.createDraftId('pj'),
        heroId,
        name: hero.origines.nom ?? '(sans nom)',
        joueur: hero.origines.joueur ?? null,
      },
    ]);
    this.pjForm.reset({heroId: null});
  }

  protected removePj(pjId: string): void {
    this.pj.update((entries) => entries.filter((e) => e.id !== pjId));
  }

  protected addCreature(): void {
    this.errorMessage.set(null);
    if (this.creatureForm.invalid) {
      this.creatureForm.markAllAsTouched();
      return;
    }
    const {creatureId, surnom} = this.creatureForm.getRawValue();
    if (!creatureId) return;
    const creature = this.allCreatures().find((c) => c.id === creatureId);
    if (!creature) return;
    this.creatures.update((entries) => [
      ...entries,
      {
        id: this.createDraftId('creature'),
        creatureId,
        surnom: surnom.trim(),
        nom: creature.nom,
        vitaliteMax: creature.vitalite,
      },
    ]);
    this.creatureForm.reset({creatureId: null, surnom: ''});
  }

  protected removeCreature(creatureId: string): void {
    this.creatures.update((entries) => entries.filter((e) => e.id !== creatureId));
  }

  protected addDemon(): void {
    this.errorMessage.set(null);
    if (this.demonForm.invalid) {
      this.demonForm.markAllAsTouched();
      return;
    }
    const {demonId, surnom} = this.demonForm.getRawValue();
    if (!demonId) return;
    const demon = this.allDemons().find((d) => d.id === demonId);
    if (!demon) return;
    this.demons.update((entries) => [
      ...entries,
      {
        id: this.createDraftId('demon'),
        demonId,
        surnom: surnom.trim(),
        nom: demon.nom,
        vitaliteMax: demon.vitalite,
      },
    ]);
    this.demonForm.reset({demonId: null, surnom: ''});
  }

  protected removeDemon(demonId: string): void {
    this.demons.update((entries) => entries.filter((e) => e.id !== demonId));
  }

  protected addPnj(): void {
    this.errorMessage.set(null);
    if (this.pnjForm.invalid) {
      this.pnjForm.markAllAsTouched();
      return;
    }
    const {pnjId, surnom} = this.pnjForm.getRawValue();
    if (!pnjId) return;
    const pnj = this.allPnjs().find((p) => p.id === pnjId);
    if (!pnj) return;
    const armes = (Array.isArray(pnj.armes) ? pnj.armes : [])
      .filter((ha): ha is import('../models/bol-arme.model').BolHerosArmeModel => typeof ha === 'object')
      .map((ha) => ({
        nom: ha.arme?.arme ?? null,
        degats: ha.arme?.degats ?? null,
        type: ha.arme?.type ?? null,
      }));
    this.pnjs.update((entries) => [
      ...entries,
      {
        id: this.createDraftId('pnj'),
        pnjId,
        surnom: surnom.trim(),
        nom: pnj.origines?.nom ?? '(sans nom)',
        vitaliteMax: pnj.ressources?.vitalite ?? 0,
        armes,
      },
    ]);
    this.pnjForm.reset({pnjId: null, surnom: ''});
  }

  protected removePnj(pnjId: string): void {
    this.pnjs.update((entries) => entries.filter((e) => e.id !== pnjId));
  }

  protected save(): void {
    this.errorMessage.set(null);
    if (this.scenarioForm.invalid) {
      this.scenarioForm.markAllAsTouched();
      this.errorMessage.set("Le titre et l'accroche sont requis.");
      return;
    }
    this.pending.set(true);
    const form = this.scenarioForm.getRawValue();
    const payload = {
      id: this.scenarioId(),
      titre: form.title,
      pitch: form.pitch,
      pj: this.pj().map((p) => ({heroId: p.heroId})),
      creatures: this.creatures().map((c) => ({creatureId: c.creatureId, surnom: c.surnom})),
      demons: this.demons().map((d) => ({demonId: d.demonId, surnom: d.surnom})),
      pnjs: this.pnjs().map((p) => ({pnjId: p.pnjId, surnom: p.surnom})),
    };
    const request$ = this.scenarioId()
      ? this.scenarioService.update(payload)
      : this.scenarioService.create(payload);
    request$.subscribe({
      next: () => {
        this.pending.set(false);
        this.router.navigate(['/library/scenarios']);
      },
      error: () => {
        this.pending.set(false);
        this.errorMessage.set('Une erreur est survenue. Réessaie.');
      },
    });
  }

  protected resetAll(): void {
    this.scenarioForm.reset({title: '', pitch: ''});
    this.pjForm.reset({heroId: null});
    this.creatureForm.reset({creatureId: null, surnom: ''});
    this.demonForm.reset({demonId: null, surnom: ''});
    this.pnjForm.reset({pnjId: null, surnom: ''});
    this.pj.set([]);
    this.creatures.set([]);
    this.demons.set([]);
    this.pnjs.set([]);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private createDraftId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
