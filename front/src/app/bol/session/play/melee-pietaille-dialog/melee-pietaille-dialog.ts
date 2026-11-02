import {ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {rollD6} from '../../combat-resolution.util';
import {MeleePietailleDialogData, MeleePietailleResult} from '../../models/melee-pietaille-dialog.model';
import {MeleeJet} from '../../models/melee-pietaille.model';
import {desDeMelee, jetDeMelee, lireJetDeMelee, nombreDeDes, pertesDeMelee, tombesParDefaut} from '../tapis/melee-pietaille.util';

/** Les deux camps, dans l'ordre du dialogue, et le camp d'en face de chacun. */
const CAMPS: readonly {readonly camp: CombatCamp; readonly titre: string; readonly adverse: CombatCamp}[] = [
  {camp: 'heros', titre: 'Suivants des héros', adverse: 'adversaires'},
  {camp: 'adversaires', titre: 'Adversaires', adverse: 'heros'},
];

/** Bascule une clé dans un ensemble : présente, elle en sort ; absente, elle y entre. */
function toggled(set: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(set);
  if (!next.delete(key)) {
    next.add(key);
  }
  return next;
}

/** « Mêlée de piétaille » (04-pnj-creatures-demons.md, « Règle de horde » ; livre p. 132) : quand de la piétaille affronte de la piétaille,
 * pas de jet d'attaque. Le camp le plus nombreux tue d6M adversaires, l'autre lui en tue d3 ; à égalité, chacun en perd d3 (interprétation).
 * Chaque camp tape le résultat de son dé lancé à table, ou le lance ici. L'application propose qui tombe (les derniers dans l'ordre de jeu)
 * en cases à cocher que le MJ peut changer ; « Appliquer » rend leur liste, rien n'est enregistré avant. */
@Component({
  selector: 'bol-melee-pietaille-dialog',
  imports: [MatButtonModule, MatCheckboxModule, MatDialogModule, MatIconModule],
  templateUrl: './melee-pietaille-dialog.html',
  styleUrl: './melee-pietaille-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeleePietailleDialogComponent {
  protected readonly data = inject<MeleePietailleDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<MeleePietailleDialogComponent, MeleePietailleResult>);

  private readonly des = desDeMelee(this.data.camps);
  protected readonly egalite = this.data.camps.heros.length === this.data.camps.adversaires.length;

  /** Ce que chaque camp a tapé, et son jet : lu dans ce qu'il a tapé, ou lancé ici (avec ses dés). */
  protected readonly typed = signal<Readonly<Record<CombatCamp, string>>>({heros: '', adversaires: ''});
  private readonly jets = signal<Readonly<Record<CombatCamp, MeleeJet | null>>>({heros: null, adversaires: null});

  /** Ce que perd chaque camp, d'après le jet d'en face ; `null` tant que ce jet manque. */
  private readonly pertes = computed(() => {
    const jets = this.jets();
    const pertes = pertesDeMelee(this.data.camps, {heros: jets.heros?.valeur ?? 0, adversaires: jets.adversaires?.valeur ?? 0});
    return {heros: jets.adversaires ? pertes.heros : null, adversaires: jets.heros ? pertes.adversaires : null};
  });

  /** Qui tombe dans chaque camp : proposé d'office à chaque nouveau jet d'en face, puis corrigé par le MJ. */
  private readonly tombes = linkedSignal<Readonly<Record<CombatCamp, ReadonlySet<string>>>>(() => {
    const pertes = this.pertes();
    return {
      heros: new Set(tombesParDefaut(this.data.camps.heros, pertes.heros ?? 0)),
      adversaires: new Set(tombesParDefaut(this.data.camps.adversaires, pertes.adversaires ?? 0)),
    };
  });

  protected readonly rows = computed(() =>
    CAMPS.map(({camp, titre, adverse}) => {
      const jet = this.jets()[camp];
      const de = this.des[camp];
      return {
        camp,
        titre,
        /** Le nom du camp dans une phrase. */
        nom: this.titreDe(camp),
        de,
        debout: this.data.camps[camp],
        typed: this.typed()[camp],
        jet,
        detail: jet && jet.des.length > 0 ? `${jet.des.join(' et ')} → ${jet.valeur}` : null,
        pertes: this.pertes()[camp],
        tombes: this.tombes()[camp],
        tues: this.titreDe(adverse),
      };
    }),
  );

  /** Les deux jets sont connus : « Appliquer » met hors de combat les piétailles cochées. */
  protected readonly ready = computed(() => this.jets().heros !== null && this.jets().adversaires !== null);

  /** Le bilan, annoncé aux lecteurs d'écran dès que les deux jets sont connus. */
  protected readonly bilan = computed(() => {
    if (!this.ready()) {
      return '';
    }
    const tombes = this.tombes();
    return `${tombes.heros.size} ${this.tombe(tombes.heros.size)} chez les suivants des héros, ${tombes.adversaires.size} chez les adversaires.`;
  });

  protected titreDe(camp: CombatCamp): string {
    return CAMPS.find((c) => c.camp === camp)?.titre.toLowerCase() ?? '';
  }

  protected tombe(n: number): string {
    return n > 1 ? 'tombent' : 'tombe';
  }

  protected onTyped(camp: CombatCamp, raw: string): void {
    const valeur = lireJetDeMelee(raw, this.des[camp]);
    this.typed.update((typed) => ({...typed, [camp]: raw}));
    this.jets.update((jets) => ({...jets, [camp]: valeur === null ? null : {des: [], valeur}}));
  }

  protected roll(camp: CombatCamp): void {
    const de = this.des[camp];
    const jet = jetDeMelee(
      de,
      Array.from({length: nombreDeDes(de)}, () => rollD6()),
    );
    this.typed.update((typed) => ({...typed, [camp]: String(jet.valeur)}));
    this.jets.update((jets) => ({...jets, [camp]: jet}));
  }

  protected toggle(camp: CombatCamp, key: string): void {
    this.tombes.update((tombes) => ({...tombes, [camp]: toggled(tombes[camp], key)}));
  }

  protected apply(): void {
    if (!this.ready()) {
      return;
    }
    const tombes = this.tombes();
    this.ref.close({tombes: [...tombes.heros, ...tombes.adversaires]});
  }
}
