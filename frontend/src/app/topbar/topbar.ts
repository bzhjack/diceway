import {Component, inject, OnInit} from '@angular/core';
import {NgIf, NgOptimizedImage} from "@angular/common";
import {AvatarModule} from 'primeng/avatar';
import {AuthService} from '../auth/services/auth.service';
import {PopoverModule} from 'primeng/popover';
import {Menu} from 'primeng/menu';
import {MenuItem} from 'primeng/api';
import {HttpClient} from '@angular/common/http';
import {UserModel} from '../auth/services/user.model';
import {environment} from '../../environments/environment';
import {Ripple} from 'primeng/ripple';

@Component({
  selector: 'app-topbar',
  imports: [
    NgOptimizedImage,
    AvatarModule,
    PopoverModule,
    Menu,
    Ripple
  ],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  me?: UserModel;
  items: MenuItem[] | undefined;

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
