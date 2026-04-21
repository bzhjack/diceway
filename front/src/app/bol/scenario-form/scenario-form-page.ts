import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputNumberModule} from 'primeng/inputnumber';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';

interface ScenarioOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

interface ScenarioLocationDraft {
  readonly id: string;
  readonly name: string;
  readonly purpose: string;
  readonly atmosphere: string;
}

interface ScenarioSceneDraft {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  readonly objective: string;
  readonly opposition: string;
  readonly beat: 'opening' | 'twist' | 'pressure' | 'climax';
}

interface StoredScenarioDraft {
  readonly title: string;
  readonly pitch: string;
  readonly tone: string;
  readonly scope: string;
  readonly sessionsPlanned: number;
  readonly startingLocation: string;
  readonly stakes: string;
  readonly opposition: string;
  readonly notes: string;
  readonly locations: readonly ScenarioLocationDraft[];
  readonly scenes: readonly ScenarioSceneDraft[];
  readonly savedAt: string;
}

@Component({
  selector: 'app-scenario-form-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    IftaLabelModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './scenario-form-page.html',
  styleUrl: './scenario-form-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioFormPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly storageKey = 'diceway-scenario-drafts';

  protected readonly toneOptions: ScenarioOption<'pulp' | 'intrigue' | 'dark' | 'exploration'>[] = [
    {label: 'Pulp', value: 'pulp'},
    {label: 'Intrigue', value: 'intrigue'},
    {label: 'Noir et brutal', value: 'dark'},
    {label: 'Exploration', value: 'exploration'},
  ];
  protected readonly scopeOptions: ScenarioOption<'one-shot' | 'mini-arc' | 'sandbox'>[] = [
    {label: 'One-shot', value: 'one-shot'},
    {label: 'Mini-arc', value: 'mini-arc'},
    {label: 'Ouvert', value: 'sandbox'},
  ];
  protected readonly beatOptions: ScenarioOption<ScenarioSceneDraft['beat']>[] = [
    {label: 'Ouverture', value: 'opening'},
    {label: 'Twist', value: 'twist'},
    {label: 'Pression', value: 'pressure'},
    {label: 'Climax', value: 'climax'},
  ];

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly savedDraftCount = signal(this.readStoredDraftCount());
  protected readonly lastSavedAt = signal<string | null>(null);
  protected readonly locations = signal<ScenarioLocationDraft[]>([]);
  protected readonly scenes = signal<ScenarioSceneDraft[]>([]);

  protected readonly scenarioForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    pitch: ['', [Validators.required, Validators.maxLength(240)]],
    tone: ['intrigue' as const, [Validators.required]],
    scope: ['mini-arc' as const, [Validators.required]],
    sessionsPlanned: [2, [Validators.required, Validators.min(1), Validators.max(12)]],
    startingLocation: ['', [Validators.required, Validators.maxLength(120)]],
    stakes: ['', [Validators.required, Validators.maxLength(2000)]],
    opposition: ['', [Validators.required, Validators.maxLength(2000)]],
    notes: ['', [Validators.maxLength(4000)]],
  });
  protected readonly locationForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    purpose: ['', [Validators.required, Validators.maxLength(200)]],
    atmosphere: ['', [Validators.maxLength(200)]],
  });
  protected readonly sceneForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    location: ['', [Validators.required, Validators.maxLength(120)]],
    objective: ['', [Validators.required, Validators.maxLength(240)]],
    opposition: ['', [Validators.maxLength(240)]],
    beat: ['opening' as const, [Validators.required]],
  });

  protected readonly readinessLabel = computed(() => {
    if (this.scenarioForm.valid && this.scenes().length >= 2 && this.locations().length >= 1) {
      return 'Prêt à ouvrir une session';
    }

    if (this.scenarioForm.valid && this.scenes().length >= 1) {
      return 'Base jouable';
    }

    return 'Brouillon MJ';
  });
  protected readonly scenarioStats = computed(() => [
    {label: 'Scènes', value: String(this.scenes().length || 0)},
    {label: 'Lieux', value: String(this.locations().length || 0)},
    {label: 'Sessions prévues', value: String(this.scenarioForm.controls.sessionsPlanned.getRawValue())},
    {label: 'Brouillons locaux', value: String(this.savedDraftCount())},
  ]);
  protected readonly scenarioSummary = computed(() => {
    const form = this.scenarioForm.getRawValue();

    return {
      title: form.title.trim() || 'Titre du scénario',
      pitch: form.pitch.trim() || 'Ajoute un pitch court pour poser la promesse de jeu.',
      tone: this.toneOptions.find((option) => option.value === form.tone)?.label ?? form.tone,
      scope: this.scopeOptions.find((option) => option.value === form.scope)?.label ?? form.scope,
      location: form.startingLocation.trim() || 'Lieu de départ à définir',
    };
  });

  protected addLocation(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const value = this.locationForm.getRawValue();
    this.locations.update((entries) => [
      ...entries,
      {
        id: this.createDraftId('location'),
        name: value.name.trim(),
        purpose: value.purpose.trim(),
        atmosphere: value.atmosphere.trim(),
      },
    ]);
    this.locationForm.reset({
      name: '',
      purpose: '',
      atmosphere: '',
    });
  }

  protected removeLocation(locationId: string): void {
    this.locations.update((entries) => entries.filter((entry) => entry.id !== locationId));
  }

  protected addScene(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.sceneForm.invalid) {
      this.sceneForm.markAllAsTouched();
      return;
    }

    const value = this.sceneForm.getRawValue();
    this.scenes.update((entries) => [
      ...entries,
      {
        id: this.createDraftId('scene'),
        title: value.title.trim(),
        location: value.location.trim(),
        objective: value.objective.trim(),
        opposition: value.opposition.trim(),
        beat: value.beat,
      },
    ]);
    this.sceneForm.reset({
      title: '',
      location: '',
      objective: '',
      opposition: '',
      beat: 'opening',
    });
  }

  protected removeScene(sceneId: string): void {
    this.scenes.update((entries) => entries.filter((entry) => entry.id !== sceneId));
  }

  protected saveDraft(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.scenarioForm.invalid) {
      this.scenarioForm.markAllAsTouched();
      this.errorMessage.set('Le titre, le pitch, le lieu de départ, les enjeux et l’opposition sont requis.');
      return;
    }

    if (this.scenes().length === 0) {
      this.errorMessage.set('Ajoute au moins une scène pour que le scénario soit exploitable en session.');
      return;
    }

    const savedAt = new Date().toISOString();
    const draft: StoredScenarioDraft = {
      ...this.scenarioForm.getRawValue(),
      locations: this.locations(),
      scenes: this.scenes(),
      savedAt,
    };
    const drafts = this.readStoredDrafts();

    localStorage.setItem(this.storageKey, JSON.stringify([draft, ...drafts].slice(0, 12)));

    this.savedDraftCount.set(this.readStoredDraftCount());
    this.lastSavedAt.set(savedAt);
    this.successMessage.set('Brouillon enregistré localement. Tu pourras ensuite ouvrir une session depuis ce scénario.');
  }

  protected resetAll(): void {
    this.scenarioForm.reset({
      title: '',
      pitch: '',
      tone: 'intrigue',
      scope: 'mini-arc',
      sessionsPlanned: 2,
      startingLocation: '',
      stakes: '',
      opposition: '',
      notes: '',
    });
    this.locationForm.reset({
      name: '',
      purpose: '',
      atmosphere: '',
    });
    this.sceneForm.reset({
      title: '',
      location: '',
      objective: '',
      opposition: '',
      beat: 'opening',
    });
    this.locations.set([]);
    this.scenes.set([]);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  protected beatLabel(value: ScenarioSceneDraft['beat']): string {
    return this.beatOptions.find((option) => option.value === value)?.label ?? value;
  }

  protected formatSavedAt(value: string | null): string {
    if (!value) {
      return 'Pas encore enregistré';
    }

    return new Date(value).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  private readStoredDrafts(): StoredScenarioDraft[] {
    const rawValue = localStorage.getItem(this.storageKey);

    if (!rawValue) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawValue) as StoredScenarioDraft[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private readStoredDraftCount(): number {
    return this.readStoredDrafts().length;
  }

  private createDraftId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
