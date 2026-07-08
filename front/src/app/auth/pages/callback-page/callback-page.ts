import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {AuthService} from '../../../core/auth/auth.service';
import {MatCard, MatCardContent, MatCardHeader, MatCardImage, MatCardTitle} from '@angular/material/card';

@Component({
  selector: 'app-callback-page',
  imports: [NgOptimizedImage, MatProgressBarModule, MatCard, MatCardImage, MatCardHeader, MatCardTitle, MatCardContent],
  templateUrl: './callback-page.html',
  styleUrl: './callback-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CallbackPageComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.handleCallback();
      await this.router.navigate(['/']);
    } catch {
      await this.router.navigate(['/login']);
    }
  }
}
