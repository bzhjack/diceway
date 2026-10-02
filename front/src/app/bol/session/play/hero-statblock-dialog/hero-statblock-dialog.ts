import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialog} from '@angular/material/dialog';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {BolArmureModel, BolHerosArmureModel} from '../../../models/bol-armure.model';
import {applyArmureEquipToggle} from '../../../shared/form/form-selection';
import {ArmureEntry, ArmureListComponent} from '../../../shared/armure/list/armure-list.component';
import {BolStatblockComponent, BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {maybePromptDefierLaMort} from '../defier-la-mort-dialog/defier-la-mort.util';

export interface HeroStatblockDialogData {
  readonly sessionId: string;
  readonly herosId: string;
  readonly pivotId: number;
  readonly heroNom: string;
  readonly avatar: string;
  readonly statblock: BolStatblockData;
  readonly vitaliteCourante: number;
  readonly vitaliteMax: number;
  readonly heroisme: number;
  readonly armures: readonly BolHerosArmureModel[];
  /** Page à laquelle revenir après édition depuis le lien "Modifier la fiche" (bol-statblock). */
  readonly returnUrl: string | null;
}

/** Armure de héros dont le catalogue (`armure`) est garanti chargé — pour l'équipement en séance. */
interface EquippableArmure {
  readonly id: number;
  readonly equipee: boolean;
  readonly armure: BolArmureModel;
}

/**
 * Fiche d'un héros en séance : statbloc en lecture (fiche complète), avec un bouton « Modifier »
 * qui ouvre en popover les réglages rapides scopés à la session (vitalité, héroïsme, équipement).
 * Un des deux onglets de `bol-hero-action-panel` — pas de fermeture propre, l'en-tête/la croix
 * appartiennent au panneau qui l'embarque ; `changed` signale au parent qu'il doit recharger la
 * session après une modification persistée.
 */
@Component({
  selector: 'bol-hero-statblock-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    DwValueStepperComponent,
    ArmureListComponent,
    BolStatblockComponent,
  ],
  templateUrl: './hero-statblock-dialog.html',
  styleUrl: './hero-statblock-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroStatblockDialogComponent implements OnInit {
  readonly data = input.required<HeroStatblockDialogData>();
  readonly changed = output<void>();
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  // Valeurs réelles posées dans `ngOnInit` (pas ici) : un input required n'a pas encore de valeur au
  // moment où les initialiseurs de champ s'exécutent (NG8118) — cf. même correctif sur
  // `action-roll-dialog.ts`.
  protected readonly vitaliteControl = new FormControl(0, {nonNullable: true});
  protected readonly heroismeControl = new FormControl(0, {nonNullable: true});
  protected readonly armures = signal<readonly EquippableArmure[]>([]);

  private lastVitalite = 0;
  private lastHeroisme = 0;

  protected readonly armureEntries = computed<readonly ArmureEntry[]>(() =>
    this.armures().map((entry) => ({
      id: entry.id,
      label: entry.armure.armure,
      protection: entry.armure.protection,
      malus: entry.armure.malus,
      ptsDePouvoir: entry.armure.pts_de_pouvoir,
      categorie: entry.armure.categorie,
      equipee: entry.equipee,
      malusAgilite: entry.armure.malus_agilite,
      malusInitiative: entry.armure.malus_initiative,
    })),
  );

  ngOnInit(): void {
    const data = this.data();
    this.lastVitalite = data.vitaliteCourante;
    this.lastHeroisme = data.heroisme;
    this.vitaliteControl.setValue(data.vitaliteCourante, {emitEvent: false});
    this.heroismeControl.setValue(data.heroisme, {emitEvent: false});
    this.armures.set(
      data.armures
        .filter((entry): entry is BolHerosArmureModel & {armure: BolArmureModel} => Boolean(entry.armure))
        .map((entry) => ({id: entry.armure_id, equipee: entry.equipee, armure: entry.armure})),
    );

    this.vitaliteControl.valueChanges.subscribe((value) => this.onVitaliteChange(value));
    this.heroismeControl.valueChanges.subscribe((value) => this.onHeroismeChange(value));
  }

  private onVitaliteChange(value: number): void {
    const delta = value - this.lastVitalite;
    if (delta === 0) {
      return;
    }

    const data = this.data();
    this.fightSessionService.applyDamage(data.sessionId, 'hero', data.pivotId, delta).subscribe({
      next: () => {
        this.lastVitalite = value;
        this.changed.emit();

        if (value < 0) {
          maybePromptDefierLaMort({
            dialog: this.dialog,
            fightSessionService: this.fightSessionService,
            herosService: this.herosService,
            sessionId: data.sessionId,
            herosId: data.herosId,
            pivotId: data.pivotId,
            heroNom: data.heroNom,
            vitaliteCourante: value,
            heroisme: this.lastHeroisme,
            // Ce callback vient de la fermeture d'un dialog imbriqué (defier-la-mort), pas d'un
            // événement du template de CE composant OnPush — sans markForCheck(), les lectures
            // directes de FormControl.value dans le template (ex. le label "Héroïsme (N)") restent
            // périmées même si le stepper lui-même (signal interne) se met à jour correctement.
            onApplied: () => {
              if (value >= -5) {
                this.lastVitalite = 0;
                this.vitaliteControl.setValue(0, {emitEvent: false});
              }
              this.lastHeroisme -= 1;
              this.heroismeControl.setValue(this.lastHeroisme, {emitEvent: false});
              this.changeDetectorRef.markForCheck();
            },
          });
        }
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
          duration: 5000,
        });
        this.vitaliteControl.setValue(this.lastVitalite, {emitEvent: false});
      },
    });
  }

  private onHeroismeChange(value: number): void {
    const delta = value - this.lastHeroisme;
    if (delta === 0) {
      return;
    }

    this.herosService.adjustHeroisme(this.data().herosId, delta).subscribe({
      next: () => {
        this.lastHeroisme = value;
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'héroïsme."), 'Fermer', {
          duration: 5000,
        });
        this.heroismeControl.setValue(this.lastHeroisme, {emitEvent: false});
      },
    });
  }

  /** Bascule locale immédiate (exclusivité par catégorie) puis persistance ; reverte en cas d'échec. */
  protected toggleArmureEquipped(index: number): void {
    const previous = this.armures();
    const target = previous[index];
    if (!target) {
      return;
    }

    this.armures.set(
      applyArmureEquipToggle(previous, index, (id) => previous.find((a) => a.id === id)?.armure.categorie ?? null),
    );

    this.herosService.equipArmure(this.data().herosId, target.id).subscribe({
      next: () => this.changed.emit(),
      error: (error: unknown) => {
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de mettre à jour l'équipement."), 'Fermer', {
          duration: 5000,
        });
        this.armures.set(previous);
      },
    });
  }
}
