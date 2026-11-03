import {computed, inject, Injectable, signal} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Observable, take} from 'rxjs';
import {confirmDialog} from '../../../../shared/dw-confirm-dialog/confirm-dialog.utils';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {BolCreaturesService} from '../../../services/bol-creatures.service';
import {BolDemonsService} from '../../../services/bol-demons.service';
import {BolHerosService} from '../../../services/bol-heros.service';
import {BolPnjService} from '../../../services/bol-pnj.service';
import {BolStatblockData} from '../../../shared/models/bol-statblock.model';
import {creatureStatblockData, demonStatblockData, pnjStatblockData} from '../../../shared/statblock/bol-statblock.builders';
import {ActionRollDiceTrait} from '../../models/action-roll.model';
import {ExpandedHeroData} from '../../models/expanded-card.model';
import {ExpandedCardDialogData} from '../../models/expanded-card-dialog.model';
import {ExpandedCardDialogComponent} from '../tapis/expanded-card-dialog';
import {findCard, heroDetails, heroHeaderStats, keepDetailsOrder, REMOVE_ACTION_LABEL} from '../tapis/tapis.util';
import {TapisCard} from '../../models/tapis.model';
import {TableStore} from './table.store';
import {CombatStatsStore} from './combat-stats.store';
import {CombatTurnStore} from './combat-turn.store';

/** La carte dépliée en dialogue : ses données, chargées à l'ouverture, ce qu'on y change (équipement, retrait). */
@Injectable()
export class ExpandedCardStore {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly herosService = inject(BolHerosService);
  private readonly pnjService = inject(BolPnjService);
  private readonly creaturesService = inject(BolCreaturesService);
  private readonly demonsService = inject(BolDemonsService);
  private readonly dialog = inject(MatDialog);
  private readonly table = inject(TableStore);
  private readonly stats = inject(CombatStatsStore);
  private readonly combat = inject(CombatTurnStore);

  /** Clé de la carte dépliée. La carte elle-même est retrouvée à chaque rechargement : si elle a
   * quitté la table (retirée, scène chargée en remplacement), plus rien n'est déplié. */
  private readonly expandedKey = signal<string | null>(null);

  private readonly expandedCard = computed(() => findCard(this.table.cards(), this.expandedKey()));

  /** La carte dépliée est un rival en combat qui peut encore prendre la fuite. */
  private readonly expandedCanFlee = computed(() => {
    const card = this.expandedCard();
    return card !== null && this.combat.canFlee(card);
  });

  /** La carte dépliée est en combat, et le MJ peut l'en retirer. */
  private readonly expandedCanWithdraw = computed(() => {
    const card = this.expandedCard();
    return card !== null && this.combat.canWithdraw(card);
  });

  /** Données de la carte dépliée, chargées au dépliage — `null` pendant le chargement. */
  private readonly expandedHero = signal<ExpandedHeroData | null>(null);

  private readonly expandedStatblock = signal<BolStatblockData | null>(null);

  private cardDialog: MatDialogRef<ExpandedCardDialogComponent> | null = null;

  /** Clic sur la face d'une carte : ouvre sa carte en dialogue (une seule à la fois). */
  onCardToggled(card: TapisCard): void {
    this.table.selectedKeys.set(new Set());
    if (this.expandedKey() === card.key) {
      return;
    }
    this.expandedKey.set(card.key);
    this.loadExpanded(card);
    this.openCardDialog();
  }

  foldCard(): void {
    this.cardDialog?.close();
    this.expandedKey.set(null);
  }

  /** « Attaquer cette carte » sur la carte ouverte : en combat, pour toute carte qui n'est ni la carte active ni
   * hors combat. */
  private openCardDialog(): void {
    const sessionId = this.table.sessionId();
    if (this.cardDialog || !sessionId) {
      return;
    }

    const data: ExpandedCardDialogData = {
      sessionId,
      card: this.expandedCard,
      hero: this.expandedHero,
      statblock: this.expandedStatblock,
      returnUrl: this.table.returnUrl,
      canFlee: this.expandedCanFlee,
      canWithdraw: this.expandedCanWithdraw,
      changed: (change) => this.table.onTableChanged(change),
      remove: (card) => this.askRemoveCard(card),
      flee: (card) => this.askFlee(card),
      withdraw: (card) => this.askWithdraw(card),
      toggleArmure: (event) => this.onArmureToggled(event),
      toggleArme: (event) => this.onArmeToggled(event),
    };
    // Le corps de la carte donne le focus à sa racine : pas de focus automatique du dialogue.
    const ref = this.dialog.open(ExpandedCardDialogComponent, {
      data,
      autoFocus: false,
      panelClass: 'exc-dialog',
      maxWidth: '96vw',
    });
    this.cardDialog = ref;
    ref.afterClosed().subscribe(() => {
      this.cardDialog = null;
      this.expandedKey.set(null);
    });
  }

  /** Charge les données de la carte dépliée. Chaque réponse est ignorée si une autre carte a été
   * dépliée entre-temps (réponses arrivées dans le désordre). */
  private loadExpanded(card: TapisCard): void {
    this.expandedHero.set(null);
    this.expandedStatblock.set(null);

    const sourceId = card.sourceId;
    const sessionId = this.table.sessionId();
    if (!sourceId || !sessionId) {
      return;
    }

    const stillExpanded = (): boolean => this.expandedKey() === card.key;

    switch (card.kind) {
      case 'hero':
        this.herosService
          .heros(sourceId)
          .pipe(take(1))
          .subscribe((hero) => {
            if (stillExpanded()) {
              this.expandedHero.set(this.buildExpandedHero(card, hero, sourceId, sessionId));
            }
          });
        break;
      case 'pnj':
        this.pnjService
          .pnj(sourceId)
          .pipe(take(1))
          .subscribe((pnj) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(pnjStatblockData(pnj));
            }
          });
        break;
      case 'creature':
        this.creaturesService
          .creature(sourceId)
          .pipe(take(1))
          .subscribe((creature) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(creatureStatblockData(creature));
            }
          });
        break;
      case 'demon':
        this.demonsService
          .demon(sourceId)
          .pipe(take(1))
          .subscribe((demon) => {
            if (stillExpanded()) {
              this.expandedStatblock.set(demonStatblockData(demon));
            }
          });
        break;
    }
  }

  private buildExpandedHero(card: TapisCard, hero: BolHerosModel, herosId: string, sessionId: string): ExpandedHeroData {
    return {
      stats: heroHeaderStats(hero),
      details: heroDetails(hero),
      resources: {
        sessionId,
        herosId,
        pivotId: card.pivotId,
        heroNom: card.nom,
        vitaliteCourante: card.vitaliteCourante ?? hero.ressources.vitalite,
        vitaliteMax: hero.ressources.vitalite,
      },
      actionRoll: {
        heroNom: card.nom,
        herosId,
        heroisme: hero.ressources.heroisme,
        agilite: hero.attributs.agilite,
        vigueur: hero.attributs.vigueur,
        esprit: hero.attributs.esprit,
        aura: hero.attributs.aura,
        equipementAgilite: hero.attributs.agilite_effective - hero.attributs.agilite,
        carrieres: hero.carrieres
          .map((c) => ({label: c.carriere?.carriere ?? '', value: c.value}))
          .filter((c) => c.label),
        diceTraits: hero.traits
          .map((trait): ActionRollDiceTrait | null => {
            const traitable = trait.traitable;
            if (!traitable) {
              return null;
            }
            if (trait.type === 'A' && 'de_bonus' in traitable && traitable.de_bonus) {
              return {label: traitable.avantage, domaine: traitable.de_bonus_domaine, kind: 'avantage'};
            }
            if (trait.type === 'D' && 'de_malus' in traitable && traitable.de_malus) {
              return {label: traitable.desavantage, domaine: traitable.de_malus_domaine, kind: 'desavantage'};
            }
            return null;
          })
          .filter((t): t is ActionRollDiceTrait => t !== null),
      },
    };
  }

  /** « Retirer de la table » depuis la carte dépliée. */
  private askRemoveCard(card: TapisCard): void {
    const sessionId = this.table.sessionId();
    if (!sessionId) {
      return;
    }

    confirmDialog(
      this.dialog,
      {
        title: REMOVE_ACTION_LABEL,
        message: `Voulez-vous retirer « ${card.nom} » de la table ?`,
        confirmLabel: 'Retirer',
      },
      {width: '380px'},
    ).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      this.fightSessionService.removeCombatant(sessionId, card.kind, card.pivotId).subscribe({
        next: (session) => this.table.session.set(session),
        error: (error: unknown) => this.table.notifyError(error, 'Impossible de retirer ce personnage.'),
      });
    });
  }

  /** « Fuite opportune » depuis la carte d'un rival : confirmée, elle dépense 1 point de vilénie et le rival quitte le combat. */
  private askFlee(card: TapisCard): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Fuite opportune',
        message: `${card.nom} dépense 1 point de vilénie et s'enfuit, profitant de ce que les héros sont distraits : il quitte le combat (il ne joue plus et ne compte plus pour l'issue), même s'il semblait mort. Sa fiche reste sur la table.`,
        confirmLabel: 'Fuir (−1 vilénie)',
      },
      {width: '420px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.combat.flee(card);
      }
    });
  }

  /** « Retirer du combat » depuis la carte : confirmé, la carte reste sur la table mais ne joue plus et ne compte plus pour l'issue. */
  private askWithdraw(card: TapisCard): void {
    confirmDialog(
      this.dialog,
      {
        title: 'Retirer du combat',
        message: `${card.nom} quitte ce combat : il ne joue plus, ne peut plus être visé et ne compte plus pour l'issue ; ses effets en cours tombent. Sa fiche reste sur la table, et il revient en jeu après le combat.`,
        confirmLabel: 'Retirer du combat',
      },
      {width: '420px'},
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.combat.withdraw(card);
        // La carte ne joue plus : elle se replie, l'écran de combat revient.
        this.foldCard();
      }
    });
  }

  /** Un clic sur une armure dans le popover d'un héros : l'équipe ou la déséquipe (le backend n'en garde qu'une
   * par catégorie). */
  private onArmureToggled(event: {card: TapisCard; armureId: number}): void {
    this.toggleEquipment(event.card, (herosId) => this.herosService.equipArmure(herosId, event.armureId));
  }

  /** Un clic sur une arme dans le popover d'un héros : l'équipe ou la déséquipe (plusieurs armes possibles). */
  private onArmeToggled(event: {card: TapisCard; armeId: number}): void {
    this.toggleEquipment(event.card, (herosId) => this.herosService.equipArme(herosId, event.armeId));
  }

  /** Enregistre un changement d'équipement, puis rafraîchit les données de la carte sur place — sans la
   * recharger, sinon le popover se fermerait —, les armes proposées à l'attaque si c'est le héros dont c'est
   * le tour, et la session, dont la défense et l'initiative changent avec l'équipement. */
  private toggleEquipment(card: TapisCard, equip: (herosId: string) => Observable<unknown>): void {
    const sessionId = this.table.sessionId();
    if (!card.sourceId || !sessionId) {
      return;
    }
    const herosId = card.sourceId;
    equip(herosId).subscribe({
      next: () => {
        this.herosService
          .heros(herosId)
          .pipe(take(1))
          .subscribe((hero) => {
            if (this.expandedKey() === card.key) {
              // Les lignes des popovers ne changent pas de place quand on coche : le tri « équipées d'abord » se fait à l'ouverture.
              const previous = this.expandedHero()?.details ?? null;
              const next = this.buildExpandedHero(card, hero, herosId, sessionId);
              this.expandedHero.set({...next, details: keepDetailsOrder(next.details, previous)});
            }
            this.stats.showIfActive(herosId, hero);
          });
        this.table.loadSession(sessionId);
      },
      error: (error: unknown) => this.table.notifyError(error, "Impossible de changer l'équipement."),
    });
  }
}
