import {Component, inject} from '@angular/core';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {UserService} from '../../auth/services/user.service';
import {AvatarModule} from "primeng/avatar";
import {AsyncPipe, CommonModule} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {NavigationEnd, Router, RouterLink} from "@angular/router";
import {filter} from "rxjs";

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    OverlayPanelModule,
    CommonModule,
    AvatarModule,
    InlineSVGModule,
    AsyncPipe,
    RouterLink
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  nameSpace: string = '';
  router = inject(Router);
  us = inject(UserService);
  userObs = this.us.user$;
  constructor() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((data) => {
      const url = (data as NavigationEnd).url;
      const sections: string[] = url.split('/');
      this.nameSpace = sections[1];
    });
  }
  logout() {
    this.us.logout();
  }
}
