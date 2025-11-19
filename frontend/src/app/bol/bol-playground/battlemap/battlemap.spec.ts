import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Battlemap } from './battlemap';

describe('Battlemap', () => {
  let component: Battlemap;
  let fixture: ComponentFixture<Battlemap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Battlemap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Battlemap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
