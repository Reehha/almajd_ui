

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';

import { LoginService } from '../services/login.service';

/**
 * Global route‑guard.
 *
 * • Redirects unauthenticated users to `/login`
 * • If the route declares `data: { roles: [...] }`, the current user
 *   must have at least one of those roles; otherwise they'll be
 *   redirected to `/unauthorized`.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private login: LoginService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    /* 1 — must be authenticated */
    if (!this.login.isLoggedIn()) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    /* 2 — role check (optional) */
    const required: string[] | undefined = route.data['roles'];
    if (required?.length && !this.login.hasAnyRole(required)) {
      return this.router.parseUrl('/unauthorized');
    }

    /* ✅ access granted */
    return true;
  }
}