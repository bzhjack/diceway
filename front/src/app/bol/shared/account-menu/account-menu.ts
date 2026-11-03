import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../core/auth/auth.service';
import {CloseTableService} from '../close-table/close-table.service';
import {TableAClore} from '../models/close-table.model';

interface AccountMenuLink {
  readonly label: string;
  readonly icon: string;
  readonly link: string;
}

const SESSION_LINKS: readonly AccountMenuLink[] = [
  {label: 'Accueil', icon: 'home', link: '/'},
  {label: 'Changer de session', icon: 'swap_horiz', link: '/library/sessions'},
  {label: 'Nouvelle session', icon: 'add', link: '/session/new'},
];

const LIBRARY_LINKS: readonly AccountMenuLink[] = [
  {label: 'Héros', icon: 'person', link: '/library/heroes'},
  {label: 'PNJ', icon: 'group', link: '/library/pnjs'},
  {label: 'Créatures', icon: 'pets', link: '/library/creatures'},
  {label: 'Démons', icon: 'bolt', link: '/library/demons'},
  {label: 'Intendance', icon: 'work', link: '/intendance'},
];

/** Menu compte de la table, du seuil et de l'accueil : tout ce qui n'est pas la partie en cours (accueil, autre session,
 * bibliothèques, déconnexion) ; à la table, de quoi la clore. */
@Component({
  selector: 'bol-account-menu',
  imports: [RouterLink, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
  template: `
    <button mat-icon-button type="button" [matMenuTriggerFor]="menu" [attr.aria-label]="'Menu de ' + userName()">
      <mat-icon>account_circle</mat-icon>
    </button>

    <mat-menu #menu="matMenu">
      @for (item of sessionLinks; track item.link) {
        <a mat-menu-item [routerLink]="item.link">
          <mat-icon>{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </a>
      }
      @if (table(); as table) {
        <button mat-menu-item type="button" (click)="clore(table)">
          <mat-icon>lock</mat-icon>
          <span>Clore la table</span>
        </button>
      }
      <mat-divider />
      @for (item of libraryLinks; track item.link) {
        <a mat-menu-item [routerLink]="item.link">
          <mat-icon>{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
        </a>
      }
      <mat-divider />
      <button mat-menu-item type="button" (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Déconnexion</span>
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountMenuComponent {
  private readonly authService = inject(AuthService);
  private readonly closeTable = inject(CloseTableService);
  private readonly router = inject(Router);

  /** La table où le menu est ouvert : il propose alors de la clore, puis ramène à l'accueil. */
  readonly table = input<TableAClore | null>(null);

  protected readonly sessionLinks = SESSION_LINKS;
  protected readonly libraryLinks = LIBRARY_LINKS;
  protected readonly userName = computed(() => this.authService.user()?.name ?? 'mon compte');

  protected clore(table: TableAClore): void {
    this.closeTable.clore(table).subscribe((close) => {
      if (close) {
        void this.router.navigateByUrl('/');
      }
    });
  }

  protected logout(): void {
    this.authService.logout();
  }
}
