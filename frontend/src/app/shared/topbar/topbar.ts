import {Component, effect, inject, input, OnInit} from '@angular/core';
import {AvatarModule} from 'primeng/avatar';
import {PopoverModule} from 'primeng/popover';
import {Menu} from 'primeng/menu';
import {MenuItem} from 'primeng/api';
import {Ripple} from 'primeng/ripple';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../auth/services/auth.service';
import {UserModel} from '../../auth/services/user.model';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-topbar',
  imports: [
    AvatarModule,
    PopoverModule,
    Menu,
    Ripple,
    RouterLink
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
  standalone: true
})
export class Topbar implements OnInit {
  private authService = inject(AuthService);

  me?: UserModel;
  items: MenuItem[] | undefined;

  title = input<string>()

  constructor() {
    effect(() => {
      if (this.title()) {
        this.items?.unshift(
          {
            label: 'Retour accueil',
            icon: 'pi pi-home',
            url: '/'
          })
      }
    });
  }

  ngOnInit() {
    this.items = [
      {
        label: 'Se déconnecter',
        icon: 'pi pi-sign-out',
        command: () => {
          this.logout();
        }
      },
    ];
    this.authService.me().subscribe(me => this.me = me);
  }

  logout() {
    this.authService.logout();
  }

  protected readonly environment = environment;
}
