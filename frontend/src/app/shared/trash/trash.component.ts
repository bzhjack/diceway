import {Component, input} from '@angular/core';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [],
  templateUrl: './trash.component.html',
  styleUrl: './trash.component.scss'
})
export class BtnComponent {
  icon = input<string>('trash');
  type = input<null | 'warn'>(null);
}
