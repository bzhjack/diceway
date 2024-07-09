import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArmuresComponent } from './armures.component';

describe('ArmuresComponent', () => {
  let component: ArmuresComponent;
  let fixture: ComponentFixture<ArmuresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArmuresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArmuresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
