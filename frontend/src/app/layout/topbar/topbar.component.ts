import { Component } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { UserService } from '../../auth/services/user.service';
import {AvatarModule} from "primeng/avatar";
import {AsyncPipe, CommonModule} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {DropdownModule} from "primeng/dropdown";

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    OverlayPanelModule,
    CommonModule,
    AvatarModule,
    InlineSVGModule,
    AsyncPipe
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  userObs = this.us.user$;
  constructor(private us: UserService) {
    this.us.user$.subscribe((user) => {
      console.log(user);
    });
  }
  logout() {
    this.us.logout();
  }
}
