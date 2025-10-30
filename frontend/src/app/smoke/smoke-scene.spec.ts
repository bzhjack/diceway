import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmokeScene } from './smoke-scene';

describe('SmokeScene', () => {
  let component: SmokeScene;
  let fixture: ComponentFixture<SmokeScene>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmokeScene]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmokeScene);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
