import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BolHeroCard } from './bol-hero-card';

describe('BolHeroCard', () => {
  let component: BolHeroCard;
  let fixture: ComponentFixture<BolHeroCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BolHeroCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BolHeroCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
