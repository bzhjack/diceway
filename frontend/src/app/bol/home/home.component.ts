import {Component, OnDestroy} from '@angular/core';
import {Subscription} from "rxjs";
import {HttpClient} from "@angular/common/http";
import {BolHeroService} from "../services/bol-hero.service";
import {BolHeroModel} from "../models/bol-hero.model";
import {JsonPipe, NgForOf} from "@angular/common";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'bol-home',
  standalone: true,
  imports: [
    NgForOf,
    JsonPipe,
    RouterLink
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class BolHomeComponent implements OnDestroy {
  private subs?: Subscription;
  public heroes: Array<BolHeroModel> = [];

  constructor(private hs: BolHeroService) {
    this.subs = this.hs.all().subscribe((heroes) => {
      this.heroes = heroes;
    });
  }

  ngOnDestroy() {
    this.subs?.unsubscribe();
  }
}
