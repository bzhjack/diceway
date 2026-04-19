import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';

@Component({
  selector: 'bol-intendance-page',
  imports: [RouterLink, ButtonModule, CardModule, TagModule],
  templateUrl: './intendance-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntendancePageComponent {
  protected readonly sections = [
    'Armes et armures',
    'Carrières et langues',
    'Avantages, désavantages et régions',
  ] as const;
}
