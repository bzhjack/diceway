import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BtnComponent} from './trash.component';

describe('BtnComponent', () => {
  let component: BtnComponent;
  let fixture: ComponentFixture<BtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BtnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
