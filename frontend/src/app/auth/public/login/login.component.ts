import { Component } from '@angular/core';
import { CardModule} from 'primeng/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CardModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

}
