import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import {DwTagComponent} from '../../../shared/dw-tag/dw-tag';
import {HubEntry} from '../models/hub-page.model';

/**
 * Une page d'accueil de bibliothèques (l'Intendance, le Bestiaire) : un en-tête sur son illustration (surtitre, titre, compteurs,
 * description, boutons projetés), puis une carte par bibliothèque, avec ses compteurs, de quoi l'ouvrir et, s'il y a lieu, y créer une
 * fiche.
 */
@Component({
  selector: 'bol-hub-page',
  imports: [RouterLink, MatButtonModule, MatCard, MatCardContent, MatIconModule, DwTagComponent],
  template: `
    <section class="dw-page xl:px-8">
      <div class="mx-auto flex max-w-[1200px] flex-col gap-4">
        <mat-card appearance="outlined" class="ip-header-card" [style.background-image]="fond()">
          <mat-card-content>
            <div class="flex flex-col gap-6">
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div class="ip-icon">
                    <mat-icon>{{ icon() }}</mat-icon>
                  </div>
                  <div class="flex min-w-0 flex-1 flex-col gap-2">
                    <p class="ip-eyebrow">{{ eyebrow() }}</p>
                    <div class="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                      <h1 class="ip-title">{{ title() }}</h1>
                      <div class="flex flex-wrap gap-2 xl:justify-end">
                        @for (tag of tags(); track tag) {
                          <dw-tag>{{ tag }}</dw-tag>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                <p class="ip-description">{{ description() }}</p>
              </div>
              <div class="library-header-actions">
                <ng-content />
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <div class="grid gap-4 lg:grid-cols-2">
          @for (entry of entries(); track entry.route) {
            <mat-card
              appearance="outlined"
              class="ip-entry-card"
              [class.ip-entry-card--illustree]="!!entry.image"
              [style.--ip-entry-image]="entry.image ? 'url(' + entry.image + ')' : null"
            >
              <mat-card-content>
                <article class="flex h-full flex-col gap-5">
                  <div class="space-y-3">
                    <div class="flex items-center gap-3">
                      <div class="ip-entry-icon">
                        @if (entry.icon === 'sword') {
                          <mat-icon svgIcon="sword" />
                        } @else {
                          <mat-icon>{{ entry.icon }}</mat-icon>
                        }
                      </div>
                      <div class="space-y-1">
                        <p class="ip-entry-kicker">{{ entry.kicker }}</p>
                        <h2 class="ip-entry-title">{{ entry.title }}</h2>
                      </div>
                    </div>
                    <p class="ip-entry-description">{{ entry.description }}</p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    @for (stat of entry.stats; track stat) {
                      <dw-tag>{{ stat }}</dw-tag>
                    }
                  </div>

                  <div class="flex flex-wrap justify-end gap-2">
                    @if (entry.creer; as creer) {
                      <button mat-stroked-button [routerLink]="creer.route" [state]="{returnUrl: entry.route}">
                        <mat-icon>add</mat-icon> {{ creer.label }}
                      </button>
                    }
                    <button mat-flat-button [routerLink]="entry.route">
                      {{ entry.buttonLabel }} <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </article>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './hub-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HubPageComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input.required<string>();
  /** L'illustration de l'en-tête (`/assets/…`). */
  readonly image = input.required<string>();
  readonly tags = input<readonly string[]>([]);
  readonly entries = input.required<readonly HubEntry[]>();

  protected readonly fond = computed(
    () =>
      'linear-gradient(90deg, rgba(15, 10, 6, 0.9) 0%, rgba(15, 10, 6, 0.78) 48%, rgba(15, 10, 6, 0.15) 78%), ' +
      'linear-gradient(to top, rgba(12, 10, 6, 0.75) 0%, rgba(12, 10, 6, 0) 35%), ' +
      `url(${this.image()})`,
  );
}
