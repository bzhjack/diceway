import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TraitRowComponent} from './trait-row.component';

describe('TraitRowComponent', () => {
  let component: TraitRowComponent;
  let fixture: ComponentFixture<TraitRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraitRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TraitRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
