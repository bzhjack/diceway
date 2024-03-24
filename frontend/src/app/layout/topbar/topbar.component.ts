import { Component } from '@angular/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { UserService } from '../../auth/services/user.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    InlineSVGModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent {
  constructor(private us: UserService) {
    this.us.user$.subscribe((user) => {
      console.log(user);
    });
  }
}
