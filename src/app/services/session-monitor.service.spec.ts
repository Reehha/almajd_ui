import { TestBed } from '@angular/core/testing';

import { SessionMonitorService } from './session-monitor.service';

describe('SessionMonitorService', () => {
  let service: SessionMonitorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionMonitorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
