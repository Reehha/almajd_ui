import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ResetPasswordGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const mustReset = localStorage.getItem('mustResetPassword') === 'true';

    if (!mustReset) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
