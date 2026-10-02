import {ChangeDetectionStrategy, Component, input, OnInit, output, signal} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {ActionRollDialogComponent, ActionRollDialogData} from '../action-roll-dialog/action-roll-dialog';
import {HeroStatblockDialogComponent, HeroStatblockDialogData} from '../hero-statblock-dialog/hero-statblock-dialog';

export interface HeroActionPanelData {
  readonly heroNom: string;
  readonly statblock: HeroStatblockDialogData;
  readonly actionRoll: ActionRollDialogData;
}

export type HeroActionPanelTab = 'fiche' | 'jet';

/**
 * Panneau latéral d'un héros en mode libre (`session-play-page`) : fiche (statbloc + réglages
 * rapides) et jet d'action réunis sous un seul en-tête, bascule par onglets plutôt que deux points
 * d'entrée séparés (bouton "Carte" vs double-clic) ouvrant chacun leur propre popup — cf. décision
 * du 2026-09-25 (fusion des deux anciens dialogs `bol-hero-statblock-dialog`/`bol-action-roll-dialog`
 * dans ce panneau unique).
 */
@Component({
  selector: 'bol-hero-action-panel',
  imports: [MatIconModule, HeroStatblockDialogComponent, ActionRollDialogComponent],
  templateUrl: './hero-action-panel.html',
  styleUrl: './hero-action-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroActionPanelComponent implements OnInit {
  readonly data = input.required<HeroActionPanelData>();
  /** Onglet affiché à l'ouverture — bouton "Carte" (statbloc) → fiche, double-clic → jet d'action. */
  readonly initialTab = input<HeroActionPanelTab>('jet');
  readonly closed = output<void>();
  /** Relais de `bol-hero-statblock-dialog` (changed) : une modification (vitalité/héroïsme/équipement) a été persistée. */
  readonly changed = output<void>();

  protected readonly activeTab = signal<HeroActionPanelTab>('jet');

  ngOnInit(): void {
    this.activeTab.set(this.initialTab());
  }

  protected showFiche(): void {
    this.activeTab.set('fiche');
  }

  protected showJet(): void {
    this.activeTab.set('jet');
  }
}
