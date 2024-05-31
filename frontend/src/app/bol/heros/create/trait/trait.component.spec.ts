import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TraitComponent } from './trait.component';

describe('TraitComponent', () => {
  let component: TraitComponent;
  let fixture: ComponentFixture<TraitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TraitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TraitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
