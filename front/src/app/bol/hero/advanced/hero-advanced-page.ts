import {Location} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {startWith, take} from 'rxjs';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatDialog} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {extractApiErrorMessage} from '../../../core/api-error.utils';
import {DwConfirmDialogComponent} from '../../../shared/dw-confirm-dialog/dw-confirm-dialog';
import {
  BolHerosAttributs,
  BolHerosCombat,
  BolHerosModel,
  BolHerosOrigines,
  BolHerosRessources
} from '../../models/bol-heros.model';
import {BolHerosCarriereModel} from '../../models/bol-carriere.model';
import {BolHerosTraitsModel} from '../../models/bol-trait.model';
import {BolHerosService} from '../../services/bol-heros.service';
import {BolHerosStateService} from '../../services/bol-heros-state.service';
import {globalFormValidator} from './create.validators';
import {HeroAdvancedOriginesComponent} from './origines/origines.component';
import {HeroAdvancedAttributsComponent} from './attributs/attributs.component';
import {HeroAdvancedCombatComponent} from './combat/combat.component';
import {HeroAdvancedRessourcesComponent} from './ressources/ressources.component';
import {HeroAdvancedTraitsComponent} from './traits/traits.component';
import {HeroAdvancedCarrieresComponent} from './carrieres/carrieres.component';
import {HeroAdvancedArmesComponent} from './armes/armes.component';
import {HeroAdvancedArmuresComponent} from './armures/armures.component';

@Component({
  selector: 'bol-hero-advanced-page',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCard,
    MatCardContent,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    HeroAdvancedOriginesComponent,
    HeroAdvancedAttributsComponent,
    HeroAdvancedCombatComponent,
    HeroAdvancedRessourcesComponent,
    HeroAdvancedTraitsComponent,
    HeroAdvancedCarrieresComponent,
    HeroAdvancedArmesComponent,
    HeroAdvancedArmuresComponent,
  ],
  templateUrl: './hero-advanced-page.html',
  styleUrl: './hero-advanced-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedPageComponent {
  private readonly herosService = inject(BolHerosService);
  private readonly herosStateService = inject(BolHerosStateService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly dialog = inject(MatDialog);
  private readonly routeParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly draftForm = this.formBuilder.group({
    joueur: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required, Validators.minLength(3)]}),
    nom: this.formBuilder.control('', {nonNullable: true, validators: [Validators.required, Validators.minLength(3)]}),
  });
  protected readonly pending = signal(false);
  protected readonly loadingHero = signal(false);
  protected readonly creatingDraft = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly returnUrl = signal<string | null>(this.readReturnUrl());
  protected readonly routeHeroId = computed(() => this.routeParamMap().get('id'));
  protected readonly hasDraft = computed(() => Boolean(this.routeHeroId()));
  protected readonly warnCount = this.herosStateService.warnCount;
  protected readonly modifiers = this.herosStateService.traitsModifiers;

  protected readonly herosForm = this.formBuilder.group(
    {
      id: this.formBuilder.control<string | null>(null),
      user_id: this.formBuilder.control<string | null>(null),
      traits: this.formBuilder.control<BolHerosTraitsModel[]>([], {nonNullable: true}),
      attributs: this.formBuilder.control<BolHerosAttributs>({
        vigueur: 0,
        agilite: 0,
        esprit: 0,
        aura: 0,
      }, {nonNullable: true}),
      combat: this.formBuilder.control<BolHerosCombat>({
        defense: 0,
        initiative: 0,
        melee: 0,
        tir: 0,
      }, {nonNullable: true}),
      armures: this.formBuilder.control<number[]>([], {nonNullable: true}),
      armes: this.formBuilder.control<number[]>([], {nonNullable: true}),
      origines: this.formBuilder.control<BolHerosOrigines>({
        nom: null,
        joueur: null,
        region_id: null,
        avatar: null,
        langues: [],
        commentaire: null,
      }, {nonNullable: true}),
      carrieres: this.formBuilder.control<BolHerosCarriereModel[]>([], {nonNullable: true}),
      ressources: this.formBuilder.control<BolHerosRessources>({
        vitalite: 10,
        heroisme: 5,
        foi: 0,
        pouvoir: 0,
        vilenie: 0,
        creation: 0,
        experience: 0,
      }, {nonNullable: true}),
      langues: this.formBuilder.control<number[]>([], {nonNullable: true}),
      type: this.formBuilder.control<'H'>('H', {nonNullable: true}),
      active: this.formBuilder.control(false, {nonNullable: true}),
    },
    {validators: globalFormValidator},
  );
  private readonly currentHero = toSignal(
    this.herosForm.valueChanges.pipe(
      startWith(this.herosForm.getRawValue()),
    ),
    {initialValue: this.herosForm.getRawValue()},
  );

  protected readonly pageTitle = computed(() =>
    this.hasDraft() ? 'Création avancée du héros' : 'Démarrer une création avancée',
  );
  protected readonly submitDisabled = computed(() => this.pending() || this.herosForm.invalid);
  protected readonly activateDisabled = computed(
    () => this.pending() || this.herosForm.invalid || this.warnCount() > 0 || this.herosForm.controls.active.value,
  );

  constructor() {
    effect(() => {
      const hero = this.mapToHero(this.currentHero());
      if (hero.id) {
        this.herosStateService.currentHeros.set(hero);
      }
    });

    effect((onCleanup) => {
      const heroId = this.routeHeroId();
      this.returnUrl.set(this.readReturnUrl());
      this.errorMessage.set(null);

      if (!heroId) {
        this.herosStateService.currentHeros.set(null);
        this.herosStateService.clearWarnings();
        this.resetForm();
        return;
      }

      this.loadingHero.set(true);
      const subscription = this.herosService.heros(heroId).subscribe({
        next: (hero) => {
          this.hydrateForm(hero);
          this.loadingHero.set(false);
        },
        error: (error) => {
          this.errorMessage.set(extractApiErrorMessage(error, 'Le chargement du héros a échoué.'));
          this.loadingHero.set(false);
        },
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected startDraft(): void {
    if (this.creatingDraft() || this.draftForm.invalid) {
      return;
    }

    this.creatingDraft.set(true);
    const draft = {
      joueur: this.draftForm.controls.joueur.value,
      nom: this.draftForm.controls.nom.value,
      type: 'H',
      active: false,
    };

    this.herosService.createHerosAdvanced(draft).subscribe({
      next: (hero: BolHerosModel) => {
        this.creatingDraft.set(false);
        this.router.navigate(['/create/hero-advanced', hero.id], {
          state: this.returnUrl() ? {returnUrl: this.returnUrl()!} : undefined,
        });
      },
      error: (error) => {
        this.creatingDraft.set(false);
        this.errorMessage.set(extractApiErrorMessage(error, "Impossible d'enregistrer le héros pour le moment."));
      },
    });
  }

  protected save(): void {
    this.submit(false);
  }

  protected confirmActivation(): void {
    const ref = this.dialog.open(DwConfirmDialogComponent, {
      data: {
        title: 'Activer le héros',
        message: 'Voulez-vous valider la création de ce héros ?',
        confirmLabel: 'Oui',
        cancelLabel: 'Non',
      },
    });

    ref.afterClosed().pipe(take(1)).subscribe((confirmed: boolean | undefined) => {
      if (confirmed) {
        this.submit(true);
      }
    });
  }

  protected goBack(): void {
    const returnUrl = this.returnUrl();
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.location.back();
  }

  protected appendCareerDisadvantage(trait: BolHerosTraitsModel | null): void {
    if (!trait) {
      return;
    }

    this.herosForm.controls.traits.setValue([...this.herosForm.controls.traits.value, trait]);
  }

  private submit(activate: boolean): void {
    if (!this.routeHeroId() || (this.herosForm.invalid && !activate)) {
      return;
    }

    this.pending.set(true);
    const payload = activate ? this.buildActivatedHero() : this.mapToHero(this.herosForm.getRawValue());
    payload.active = activate || payload.active;

    this.herosService.updateHerosAdvanced(payload).subscribe({
      next: () => {
        this.pending.set(false);
        const returnUrl = this.returnUrl();
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }
        this.router.navigate(['/library/heroes']);
      },
      error: (error) => {
        this.pending.set(false);
        this.errorMessage.set(extractApiErrorMessage(error, "Impossible d'enregistrer le héros pour le moment."));
      },
    });
  }

  private buildActivatedHero(): BolHerosModel {
    const hero = this.mapToHero(this.herosForm.getRawValue());
    const combat = {...hero.combat};
    const attributs = {...hero.attributs};
    const ressources = {...hero.ressources};

    for (const modifier of this.modifiers()) {
      const key = modifier.attr as keyof BolHerosCombat & keyof BolHerosAttributs & keyof BolHerosRessources;
      if (key in ressources) {
        ressources[key as keyof BolHerosRessources] =
          Number(ressources[key as keyof BolHerosRessources]) + Number(modifier.value);
      } else if (key in combat) {
        combat[key as keyof BolHerosCombat] =
          Number(combat[key as keyof BolHerosCombat]) + Number(modifier.value);
      } else if (key in attributs) {
        attributs[key as keyof BolHerosAttributs] =
          Number(attributs[key as keyof BolHerosAttributs]) + Number(modifier.value);
      }
    }

    return {
      ...hero,
      active: true,
      combat,
      attributs,
      ressources,
    };
  }

  private mapToHero(raw: typeof this.herosForm.value): BolHerosModel {
    const langues = (raw.origines?.langues ?? raw.langues ?? []).map((item) => Number(item));

    return {
      id: raw.id ?? null,
      user_id: raw.user_id ?? null,
      active: raw.active ?? false,
      type: 'H',
      origines: {
        avatar: raw.origines?.avatar ?? null,
        nom: raw.origines?.nom ?? null,
        region_id: raw.origines?.region_id ?? null,
        joueur: raw.origines?.joueur ?? null,
        langues,
        commentaire: raw.origines?.commentaire ?? null,
      },
      ressources: {
        vitalite: raw.ressources?.vitalite ?? 10,
        heroisme: raw.ressources?.heroisme ?? 5,
        foi: raw.ressources?.foi ?? 0,
        pouvoir: raw.ressources?.pouvoir ?? 0,
        creation: raw.ressources?.creation ?? 0,
        experience: raw.ressources?.experience ?? 0,
        vilenie: raw.ressources?.vilenie ?? 0,
      },
      combat: {
        initiative: raw.combat?.initiative ?? 0,
        melee: raw.combat?.melee ?? 0,
        tir: raw.combat?.tir ?? 0,
        defense: raw.combat?.defense ?? 0,
      },
      attributs: {
        vigueur: raw.attributs?.vigueur ?? 0,
        aura: raw.attributs?.aura ?? 0,
        esprit: raw.attributs?.esprit ?? 0,
        agilite: raw.attributs?.agilite ?? 0,
      },
      traits: raw.traits ?? [],
      carrieres: raw.carrieres ?? [],
      langues,
      armures: raw.armures ?? [],
      armes: raw.armes ?? [],
    };
  }

  private hydrateForm(hero: BolHerosModel): void {
    const langues = (hero.langues ?? hero.origines.langues ?? []).map((item) =>
      typeof item === 'number' ? item : item.langue_id,
    );

    const heroRessources = {
      ...hero.ressources,
      vitalite: hero.active ? Number(hero.ressources.vitalite ?? 10) : 10,
      heroisme: hero.active ? Number(hero.ressources.heroisme ?? 5) : 5,
    };

    this.herosForm.patchValue({
      id: hero.id,
      user_id: hero.user_id,
      active: hero.active,
      type: 'H',
      ressources: heroRessources,
      armures: hero.armures.map((item) => (typeof item === 'number' ? item : item.armure_id)),
      armes: hero.armes.map((item) => (typeof item === 'number' ? item : item.arme_id)),
      combat: hero.combat,
      attributs: hero.attributs,
      origines: {
        ...hero.origines,
        langues,
      },
      carrieres: hero.carrieres.map((item) => ({
        carriere_id: item.carriere_id,
        value: item.value,
      })),
      langues,
      traits: hero.traits.map((item) => ({
        id: item.id,
        traitable_id: item.traitable_id,
        type: item.type,
        detail: item.detail,
        region_id: item.region_id,
        carriere: item.carriere,
      })),
    });
  }

  private resetForm(): void {
    this.herosForm.reset({
      id: null,
      user_id: null,
      traits: [],
      attributs: {vigueur: 0, agilite: 0, esprit: 0, aura: 0},
      combat: {defense: 0, initiative: 0, melee: 0, tir: 0},
      armures: [],
      armes: [],
      origines: {
        nom: null,
        joueur: null,
        region_id: null,
        avatar: null,
        langues: [],
        commentaire: null,
      },
      carrieres: [],
      ressources: {vitalite: 10, heroisme: 5, foi: 0, pouvoir: 0, vilenie: 0, creation: 0, experience: 0},
      langues: [],
      type: 'H',
      active: false,
    });
  }

  private readReturnUrl(): string | null {
    const state = this.location.getState() as {returnUrl?: string} | null;
    return state?.returnUrl ?? null;
  }

}
