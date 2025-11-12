import { TestBed } from '@angular/core/testing';

import { PubilcService } from './pubilc.service';

describe('PubilcService', () => {
  let service: PubilcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PubilcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
