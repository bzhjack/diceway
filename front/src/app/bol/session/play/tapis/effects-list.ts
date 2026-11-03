import {afterNextRender, ChangeDetectionStrategy, Component, computed, ElementRef, inject, Injector, input, output, signal, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {CombatEffect, EffectDuration, EffectStat, NewEffect} from '../../models/combat-effect.model';
import {descriptionEffet, dureeLibre, dureesLibres, EFFETS_MODELES, effetLibre, libelleDuree} from './combat-effects.util';

/** Les statistiques qu'un effet libre peut changer, dans l'ordre du formulaire. */
const STATS_LIBRES: readonly {readonly stat: EffectStat; readonly libelle: string; readonly aide: string}[] = [
  {stat: 'attaque', libelle: 'Attaque', aide: 'à ses jets d’attaque'},
  {stat: 'defense', libelle: 'Défense', aide: 'à sa défense quand on l’attaque'},
  {stat: 'degats', libelle: 'Dégâts', aide: 'aux dégâts qu’il inflige'},
  {stat: 'protection', libelle: 'Protection', aide: 'à sa protection quand on le blesse'},
  {stat: 'action', libelle: 'Action', aide: 'un dé de malus à ses jets'},
];

/** Une carte nommée, pour afficher à qui appartient un effet et à qui l'ajouter. */
interface CarteEffets {
  readonly key: string;
  readonly nom: string;
}

/** Un effet prêt à afficher : son texte, sa durée et à qui il est. */
interface EffetAffiche {
  readonly id: string;
  readonly porteur: string;
  readonly texte: string;
  readonly duree: string;
  /** Un effet déduit de l'état (identifiant `derive-…`) n'est pas stocké : rien à retirer. */
  readonly retirable: boolean;
}

/** Les effets en cours sur les deux duellistes, en pastilles sur une ligne, chacun retirable, et le menu pour en ajouter un à la main. */
@Component({
  selector: 'bol-effects-list',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, DwValueStepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="efl" aria-label="Effets en cours">
      @for (effet of affiches(); track effet.id) {
        <div class="efl-row">
          <span class="efl-text"><b>{{ effet.porteur }}</b> · {{ effet.texte }} <i>{{ effet.duree }}</i></span>
          @if (effet.retirable) {
            <button type="button" class="efl-remove" [attr.aria-label]="'Retirer l’effet ' + effet.texte + ' de ' + effet.porteur" (click)="retire.emit(effet.id)">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      } @empty {
        <p class="efl-empty">Aucun</p>
      }

      <button type="button" class="efl-add" [matMenuTriggerFor]="addMenu" [disabled]="cartes().length === 0">
        <mat-icon aria-hidden="true">add</mat-icon> Effet
      </button>

      <mat-menu #addMenu="matMenu">
        @for (carte of cartes(); track carte.key) {
          @for (modele of modeles; track modele.id) {
            <button mat-menu-item type="button" (click)="ajoute.emit(modele.creer(carte.key))">{{ carte.nom }} : {{ modele.libelle }}</button>
          }
          <button mat-menu-item type="button" (click)="ouvrirLibre(carte.key)">{{ carte.nom }} : effet libre…</button>
        }
      </mat-menu>
    </section>

    @if (libre(); as porteur) {
      <!-- L'effet libre : son nom, ce qu'il change, de combien, et pour combien de temps -->
      <form class="efl-libre" [attr.aria-label]="'Effet libre pour ' + nomDe(porteur)" (submit)="valideLibre($event)">
        <span class="efl-libre-titre">Effet libre · {{ nomDe(porteur) }}</span>
        <label class="efl-field">
          <span>Nom</span>
          <input #nomLibre type="text" maxlength="60" autocomplete="off" [placeholder]="statChoisie().libelle.toLowerCase()" [value]="libelle()" (input)="libelle.set(nomLibre.value)" />
        </label>
        <div class="efl-field">
          <span id="efl-stat">Change</span>
          <div class="efl-segs" role="group" aria-labelledby="efl-stat">
            @for (s of stats; track s.stat) {
              <button type="button" class="efl-seg" [attr.aria-pressed]="stat() === s.stat" [attr.title]="s.aide" (click)="choisitStat(s.stat)">{{ s.libelle }}</button>
            }
          </div>
          <small class="efl-aide">{{ statChoisie().aide }}</small>
        </div>
        @if (stat() !== 'action') {
          <div class="efl-field">
            <span>Valeur</span>
            <dw-value-stepper [value]="valeur()" (valueChange)="valeur.set($event)" [min]="-6" [max]="6" ariaLabel="Valeur de l'effet libre" />
          </div>
        }
        <div class="efl-field">
          <span id="efl-duree">Jusqu’à</span>
          <div class="efl-segs" role="group" aria-labelledby="efl-duree">
            @for (d of durees(); track d.type) {
              <button type="button" class="efl-seg" [attr.aria-pressed]="duree() === d.type" (click)="duree.set(d.type)">{{ d.compte ? nombre() + ' ' + d.libelle : d.libelle }}</button>
            }
          </div>
          @if (dureeAvecNombre()) {
            <dw-value-stepper [value]="nombre()" (valueChange)="nombre.set($event)" [min]="1" [max]="20" ariaLabel="Nombre de rounds ou d'attaques subies" />
          }
        </div>
        <div class="efl-libre-actions">
          <button mat-stroked-button type="button" (click)="libre.set(null)">Annuler</button>
          <button mat-flat-button type="submit" [disabled]="stat() !== 'action' && valeur() === 0">Ajouter</button>
        </div>
      </form>
    }
  `,
  styles: `
    /* Dans la carte de l'attaquant (qui porte le titre « Effets ») : une pastille par effet, puis le bouton qui en ajoute un. */
    .efl { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem 0.5rem; }
    .efl-row { display: flex; align-items: center; gap: 0.2rem; padding: 0.05rem 0.2rem 0.05rem 0.6rem; border: 1px solid var(--dw-border); border-radius: 14px; background: var(--dw-surface-50); font-size: 0.78rem; line-height: 1.3; color: var(--dw-surface-800); }
    .efl-text i { color: var(--dw-surface-600); font-style: normal; }
    .efl-remove { display: grid; place-items: center; width: 1.4rem; height: 1.4rem; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--dw-surface-500); cursor: pointer; }
    .efl-remove:hover { color: var(--dw-color-echec); }
    .efl-remove:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 1px; }
    .efl-remove .mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    .efl-empty { margin: 0; font-size: 0.8rem; color: var(--dw-surface-500); }
    /* Le bouton qui ajoute un effet : de la taille des boutons « Fiche » et « Défense totale » de l'assistant. */
    .efl-add { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.3rem 0.65rem 0.3rem 0.45rem; border: 1px solid var(--dw-border); border-radius: var(--dw-radius-pill); background: var(--dw-surface-50); color: var(--dw-surface-700); font: inherit; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
    .efl-add:hover:not(:disabled) { border-color: var(--dw-surface-500); color: var(--dw-surface-900); }
    .efl-add:disabled { opacity: 0.45; cursor: default; }
    .efl-add:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 2px; }
    .efl-add .mat-icon { width: 1rem; height: 1rem; font-size: 1rem; }
    /* L'effet libre, sous la liste : un petit formulaire dans le popover. */
    .efl-libre { display: grid; gap: 0.5rem; margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid var(--dw-border); max-width: 26rem; }
    .efl-libre-titre { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dw-surface-600); }
    .efl-field { display: grid; gap: 0.25rem; font-size: 0.8rem; color: var(--dw-surface-700); }
    .efl-field > span { font-weight: 700; }
    .efl-field input[type='text'] { padding: 0.35rem 0.5rem; border: 1px solid var(--dw-border); border-radius: var(--dw-radius-toggle); background: var(--dw-surface-0); color: var(--dw-surface-900); font: inherit; }
    .efl-field input[type='text']:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 1px; }
    .efl-aide { color: var(--dw-surface-600); }
    .efl-segs { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .efl-seg { padding: 0.22rem 0.55rem; border: 1px solid var(--dw-border); border-radius: var(--dw-radius-toggle); background: var(--dw-surface-0); color: var(--dw-surface-900); font: inherit; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .efl-seg[aria-pressed='true'] { border-color: var(--dw-color-legendary); background: var(--dw-color-legendary); color: var(--dw-surface-0); }
    .efl-seg:focus-visible { outline: 2px solid var(--dw-color-legendary); outline-offset: 2px; }
    .efl-libre-actions { display: flex; justify-content: flex-end; gap: 0.4rem; }
  `,
})
export class EffectsListComponent {
  readonly effets = input.required<readonly CombatEffect[]>();
  /** Les deux cartes du duel : attaquant et cible. Une carte absente de cette liste n'affiche pas ses effets. */
  readonly cartes = input.required<readonly CarteEffets[]>();
  readonly retire = output<string>();
  readonly ajoute = output<NewEffect>();

  protected readonly modeles = EFFETS_MODELES;
  protected readonly stats = STATS_LIBRES;

  private readonly injector = inject(Injector);
  private readonly nomLibre = viewChild<ElementRef<HTMLInputElement>>('nomLibre');

  /** L'effet libre en cours de saisie : la carte qui le portera, ou `null`. */
  protected readonly libre = signal<string | null>(null);
  protected readonly libelle = signal('');
  protected readonly stat = signal<EffectStat>('attaque');
  protected readonly valeur = signal(1);
  protected readonly duree = signal<EffectDuration['type']>('fin-round');
  protected readonly nombre = signal(1);

  protected readonly statChoisie = computed(() => STATS_LIBRES.find((s) => s.stat === this.stat()) ?? STATS_LIBRES[0]);
  protected readonly durees = computed(() => dureesLibres(this.stat()));
  protected readonly dureeAvecNombre = computed(() => this.durees().find((d) => d.type === this.duree())?.compte ?? false);

  protected nomDe(key: string): string {
    return this.cartes().find((carte) => carte.key === key)?.nom ?? key;
  }

  /** « Effet libre… » du menu : le formulaire s'ouvre pour cette carte, repart de zéro, et la main va à son nom. */
  protected ouvrirLibre(porteur: string): void {
    this.libelle.set('');
    this.stat.set('attaque');
    this.valeur.set(1);
    this.duree.set('fin-round');
    this.nombre.set(1);
    this.libre.set(porteur);
    afterNextRender(() => this.nomLibre()?.nativeElement.focus(), {injector: this.injector});
  }

  /** Une autre statistique : un dé de malus part pour sa prochaine action ; une durée que la statistique ne propose pas revient à la fin
   * du round. */
  protected choisitStat(stat: EffectStat): void {
    this.stat.set(stat);
    if (stat === 'action') {
      this.duree.set('action-porteur');
    } else if (!dureesLibres(stat).some((d) => d.type === this.duree())) {
      this.duree.set('fin-round');
    }
  }

  protected valideLibre(event: Event): void {
    event.preventDefault();
    const porteur = this.libre();
    if (!porteur || (this.stat() !== 'action' && this.valeur() === 0)) {
      return;
    }
    this.ajoute.emit(effetLibre({porteur, libelle: this.libelle(), stat: this.stat(), valeur: this.valeur(), duree: dureeLibre(this.duree(), this.nombre())}));
    this.libre.set(null);
  }

  protected readonly affiches = computed<readonly EffetAffiche[]>(() => {
    const noms = new Map(this.cartes().map((carte) => [carte.key, carte.nom]));
    return this.effets()
      .filter((effet) => noms.has(effet.porteur))
      .map((effet) => ({
        id: effet.id,
        porteur: noms.get(effet.porteur) ?? effet.porteur,
        texte: descriptionEffet(effet),
        duree: libelleDuree(effet.duree),
        retirable: !effet.id.startsWith('derive-'),
      }));
  });
}
