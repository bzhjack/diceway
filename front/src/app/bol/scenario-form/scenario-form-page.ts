import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {IftaLabelModule} from 'primeng/iftalabel';
import {InputTextModule} from 'primeng/inputtext';
import {TagModule} from 'primeng/tag';
import {TextareaModule} from 'primeng/textarea';

interface ScenarioPjDraft {
  readonly id: string;
  readonly name: string;
}

interface StoredScenarioDraft {
  readonly title: string;
  readonly pitch: string;
  readonly pj: readonly ScenarioPjDraft[];
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
    InputTextModule,
    TagModule,
    TextareaModule,
  ],
  templateUrl: './scenario-form-page.html',
  host: {class: 'block'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenarioFormPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly storageKey = 'diceway-scenario-drafts';

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly savedDraftCount = signal(this.readStoredDraftCount());
  protected readonly lastSavedAt = signal<string | null>(null);
  protected readonly pj = signal<ScenarioPjDraft[]>([]);

  protected readonly scenarioForm = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    pitch: ['', [Validators.required, Validators.maxLength(240)]],
  });
  protected readonly pjForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
  });

  protected readonly scenarioSummary = computed(() => {
    const form = this.scenarioForm.getRawValue();
    return {
      title: form.title.trim() || 'Titre du scénario',
      pitch: form.pitch.trim() || 'Ajoute une accroche pour poser la promesse de jeu.',
    };
  });

  protected addPj(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.pjForm.invalid) {
      this.pjForm.markAllAsTouched();
      return;
    }

    const value = this.pjForm.getRawValue();
    this.pj.update((entries) => [
      ...entries,
      {id: this.createDraftId('pj'), name: value.name.trim()},
    ]);
    this.pjForm.reset({name: ''});
  }

  protected removePj(pjId: string): void {
    this.pj.update((entries) => entries.filter((entry) => entry.id !== pjId));
  }

  protected saveDraft(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.scenarioForm.invalid) {
      this.scenarioForm.markAllAsTouched();
      this.errorMessage.set('Le titre et l\'accroche sont requis.');
      return;
    }

    const savedAt = new Date().toISOString();
    const draft: StoredScenarioDraft = {
      ...this.scenarioForm.getRawValue(),
      pj: this.pj(),
      savedAt,
    };
    const drafts = this.readStoredDrafts();
    localStorage.setItem(this.storageKey, JSON.stringify([draft, ...drafts].slice(0, 12)));
    this.savedDraftCount.set(this.readStoredDraftCount());
    this.lastSavedAt.set(savedAt);
    this.successMessage.set('Brouillon enregistré localement. Tu pourras ensuite ouvrir une session depuis ce scénario.');
  }

  protected resetAll(): void {
    this.scenarioForm.reset({title: '', pitch: ''});
    this.pjForm.reset({name: ''});
    this.pj.set([]);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  protected formatSavedAt(value: string | null): string {
    if (!value) {
      return 'Pas encore enregistré';
    }
    return new Date(value).toLocaleString('fr-FR', {dateStyle: 'short', timeStyle: 'short'});
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
