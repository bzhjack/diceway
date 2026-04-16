import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-notice-page',
  imports: [RouterLink, ButtonModule, NgOptimizedImage],
  templateUrl: './notice-page.html',
  styleUrl: './notice-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticePageComponent {
  private readonly route = inject(ActivatedRoute);
  protected reset = !!this.route.snapshot.paramMap.get('mode');
}
