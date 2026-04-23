import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {switchMap, filter} from 'rxjs/operators';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';
import {BolHerosService} from '../services/bol-heros.service';
import {BolScenarioService} from '../services/bol-scenario.service';

interface ScenarioPjDraft {
  readonly id: string;
  readonly heroId: string;
  readonly name: string;
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
  private readonly scenarioService = inject(BolScenarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly heroes = toSignal(this.bolHerosService.heroes(), {initialValue: []});

  protected readonly scenarioId = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly pj = signal<ScenarioPjDraft[]>([]);

  protected readonly heroOptions = computed(() =>
    this.heroes()
      .filter((h) => h.active)
      .map((h) => ({
        label: h.origines.nom ?? '(sans nom)',
        value: h.id as string,
      })),
  );

  protected readonly scenarioForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    pitch: ['', [Validators.required, Validators.maxLength(240)]],
  });
  protected readonly pjForm = this.formBuilder.group({
    heroId: [null as string | null, [Validators.required]],
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
          })),
        );
      });
    }
  }

  protected addPj(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.pjForm.invalid) {
      this.pjForm.markAllAsTouched();
      return;
    }

    const heroId = this.pjForm.getRawValue().heroId!;
    const hero = this.heroes().find((h) => h.id === heroId);
    if (!hero) {
      return;
    }

    if (this.pj().some((p) => p.heroId === heroId)) {
      this.errorMessage.set('Ce personnage est déjà dans la liste.');
      return;
    }

    this.pj.update((entries) => [
      ...entries,
      {id: this.createDraftId('pj'), heroId, name: hero.origines.nom ?? '(sans nom)'},
    ]);
    this.pjForm.reset({heroId: null});
  }

  protected removePj(pjId: string): void {
    this.pj.update((entries) => entries.filter((entry) => entry.id !== pjId));
  }

  protected save(): void {
    this.successMessage.set(null);
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
    this.pj.set([]);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private createDraftId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
