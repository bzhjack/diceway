import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-callback',
  standalone: true,
  imports: [],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit {
  constructor(private route: ActivatedRoute, private userService: UserService, private router: Router) { }
  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.authenticate(token);
    }
  }
  authenticate(token: string) {
    console.log(token);
    this.userService.profile(token)
      .subscribe(
        {
          next:
            (result: any) => {
              if (result) {
                this.userService.storeLoggedInUser({ profile: result, token })
                this.router.navigate(['/'])
              }
            },
          error: (err) => this.router.navigate(['/notfound'])
        }
      );
  }

}
