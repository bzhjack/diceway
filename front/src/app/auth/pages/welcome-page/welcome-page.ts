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
  MatCardTitle,
} from '@angular/material/card';

@Component({
  selector: 'app-welcome-page',
  imports: [
    RouterLink,
    NgOptimizedImage,
    MatButtonModule,
    MatCard,
    MatCardImage,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
  ],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePageComponent {
  private readonly route = inject(ActivatedRoute);
  protected success = !!this.route.snapshot.paramMap.get('state');
}
