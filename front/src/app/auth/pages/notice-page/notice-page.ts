import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardImage,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';

@Component({
  selector: 'app-notice-page',
  imports: [
    RouterLink,
    NgOptimizedImage,
    MatButtonModule,
    MatCard,
    MatCardImage,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardContent,
    MatCardActions,
  ],
  templateUrl: './notice-page.html',
  styleUrl: './notice-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoticePageComponent {
  private readonly route = inject(ActivatedRoute);
  protected reset = !!this.route.snapshot.paramMap.get('mode');
}
