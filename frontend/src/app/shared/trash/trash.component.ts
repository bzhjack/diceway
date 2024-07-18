import {Component, input} from '@angular/core';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [],
  templateUrl: './trash.component.html',
  styleUrl: './trash.component.scss'
})
export class TrashComponent {
  icon = input<string>('trash');
  type = input<null | 'warn'>(null);
}
