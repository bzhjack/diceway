import {TestBed} from '@angular/core/testing';

import {BolHerosStateService} from './bol-heros-state.service';

describe('BolHerosStateService', () => {
  let service: BolHerosStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BolHerosStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
