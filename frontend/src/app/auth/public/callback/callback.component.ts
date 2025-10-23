import {Component, inject, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {ProgressBarModule} from 'primeng/progressbar';
import {AuthService} from '../../auth.service';

@Component({
    selector: 'app-callback',
    imports: [
        InlineSVGModule,
        ProgressBarModule
    ],
    templateUrl: './callback.component.html',
    styleUrl: './callback.component.scss'
})
export class CallbackComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  async ngOnInit(): Promise<void> {
    try {
      await this.auth.handleCallback();
    } catch (e) {
      // Optionally log the error; keep UX simple
      // console.error('Auth callback failed', e);
    } finally {
      // Navigate to a default route after processing
      this.router.navigate(['/login']);
    }
  }

}
