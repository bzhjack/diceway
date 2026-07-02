import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {
  MatCard,
  MatCardActions,
  MatCardHeader,
  MatCardImage,
  MatCardSubtitle,
  MatCardTitle,
} from '@angular/material/card';

@Component({
  selector: 'app-notfound-page',
  imports: [
    RouterLink,
    NgOptimizedImage,
    MatButtonModule,
    MatCard,
    MatCardImage,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardActions,
  ],
  templateUrl: './notfound-page.html',
  styleUrl: './notfound-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotfoundPageComponent {}
