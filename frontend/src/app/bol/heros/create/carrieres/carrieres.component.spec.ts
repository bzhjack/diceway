import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarrieresComponent } from './carrieres.component';

describe('CarrieresComponent', () => {
  let component: CarrieresComponent;
  let fixture: ComponentFixture<CarrieresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarrieresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CarrieresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
