import { TestBed } from '@angular/core/testing';

import { InfoSearchService } from './info-search.service';

describe('InfoSearchService', () => {
  let service: InfoSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InfoSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
