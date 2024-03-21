import { Component } from '@angular/core';
import { UserService } from '../auth/services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  constructor(private userService: UserService) { }
  ngOnInit(): void {
    this.hello();
  }
  hello() {
    this.userService.getHello()
      .subscribe(
        {
          next:
            (result: any) => {
              console.log(result);
            },
          error: (err) => this.authenticationFailed(err)
        }
      );
  }

  authenticationFailed(error: unknown) {
    console.error('Authentication failed: ' + error);
  }
}
