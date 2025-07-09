import { TestBed } from '@angular/core/testing';
import { CanDeactivateFn } from '@angular/router';

import { qrScannerExitGuard } from './qr-scanner-exit.guard';

describe('qrScannerExitGuard', () => {
  const executeGuard: CanDeactivateFn<unknown> = (...guardParameters) => 
      TestBed.runInInjectionContext(() => qrScannerExitGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
