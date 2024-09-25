import {ComponentFixture, TestBed} from '@angular/core/testing';

import {DiceResultComponent} from './dice-result.component';

describe('DiceResultComponent', () => {
  let component: DiceResultComponent;
  let fixture: ComponentFixture<DiceResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DiceResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
