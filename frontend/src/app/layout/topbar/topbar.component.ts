import {Component, OnDestroy} from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { UserService } from '../../auth/services/user.service';
import {AvatarModule} from "primeng/avatar";
import {AsyncPipe, CommonModule} from "@angular/common";
import {OverlayPanelModule} from "primeng/overlaypanel";
import {DropdownModule} from "primeng/dropdown";
import {Subscription} from "rxjs";

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
export class TopbarComponent implements OnDestroy {
  userObs = this.us.user$;
  currentUser: any;
  sub?: Subscription;
  constructor(private us: UserService) {
    this.us.user$.subscribe((user) => {
      console.log(user);
      this.currentUser = user;
    });
  }
  logout() {
    this.us.clearTokens();
    this.us.logout();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
