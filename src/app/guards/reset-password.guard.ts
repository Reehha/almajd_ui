import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordGuard implements CanActivate {
  private storage: Storage | null;

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    private router: Router
  ) {
    this.storage = isPlatformBrowser(platformId) ? window.localStorage : null;
  }

  canActivate(): boolean {
    const mustReset = this.storage?.getItem('mustResetPassword') === 'true';

    if (!mustReset) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
