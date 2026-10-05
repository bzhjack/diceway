import {ChangeDetectionStrategy, Component, computed, inject, input, OnInit, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolHerosService} from '../../../services/bol-heros.service';
import {BolArmureModel, BolHerosArmureModel} from '../../../models/bol-armure.model';
import {applyArmureEquipToggle} from '../../../shared/form/form-selection';
import {ArmureEntry, ArmureListComponent} from '../../../shared/armure/list/armure-list.component';
import {BolStatblockComponent, BolStatblockData} from '../../../shared/statblock/bol-statblock.component';
import {HeroResourcesComponent} from '../hero-resources/hero-resources';

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
 * Un des deux onglets de `bol-expanded-card` — pas de fermeture propre, l'en-tête/la croix
 * appartiennent au panneau qui l'embarque ; `changed` signale au parent qu'il doit recharger la
 * session après une modification persistée.
 */
@Component({
  selector: 'bol-hero-statblock-dialog',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    HeroResourcesComponent,
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
  private readonly herosService = inject(BolHerosService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly heroisme = signal(0);
  protected readonly armures = signal<readonly EquippableArmure[]>([]);

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
    this.heroisme.set(data.heroisme);
    this.armures.set(
      data.armures
        .filter((entry): entry is BolHerosArmureModel & {armure: BolArmureModel} => Boolean(entry.armure))
        .map((entry) => ({id: entry.armure_id, equipee: entry.equipee, armure: entry.armure})),
    );
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
