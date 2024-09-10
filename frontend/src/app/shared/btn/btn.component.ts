import {Component, input} from '@angular/core';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [],
  templateUrl: './btn.component.html',
  styleUrl: './btn.component.scss'
})
export class BtnComponent {
  icon = input<string>('trash');
  type = input<null | 'warn' | 'info'>(null);
}
