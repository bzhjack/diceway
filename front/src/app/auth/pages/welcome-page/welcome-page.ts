import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-welcome-page',
  imports: [RouterLink, ButtonModule, NgOptimizedImage],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePageComponent {
  private readonly route = inject(ActivatedRoute);
  protected success = !!this.route.snapshot.paramMap.get('state');
}
