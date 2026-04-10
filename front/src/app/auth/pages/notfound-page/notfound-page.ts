import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-notfound-page',
  imports: [RouterLink, ButtonModule, NgOptimizedImage],
  templateUrl: './notfound-page.html',
  styleUrl: './notfound-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotfoundPageComponent {}
