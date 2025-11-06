import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BolPlayground} from './bol-playground';

describe('BolPlayground', () => {
  let component: BolPlayground;
  let fixture: ComponentFixture<BolPlayground>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BolPlayground]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BolPlayground);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
