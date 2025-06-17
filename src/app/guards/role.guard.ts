

import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { LoginService } from '../services/login.service';

/**
 * Guard that checks whether a user is logged‑in **and**
 * holds at least one of the roles specified in the route’s
 * `data.roles` array.  
 *
 * Usage example in a route:
 * ```ts
 * {
 *   path: 'admin',
 *   canActivate: [RoleGuard],
 *   data: { roles: ['admin'] },
 *   loadComponent: () => import('./admin.component').then(m => m.AdminComponent)
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {

  constructor(
    private readonly auth: LoginService,
    private readonly router: Router
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): boolean | UrlTree {

    // 1️⃣  Must be logged‑in
    if (!this.auth.isLoggedIn()) {
      return this.router.createUrlTree(['/login']);
    }

    // 2️⃣  Roles from route definition (optional)
    const required: string[] | undefined = next.data['roles'];

    // No roles requested → allow
    if (!required || required.length === 0) {
      return true;
    }

    // 3️⃣  Check roles
    return this.auth.hasAnyRole(required)
      ? true
      : this.router.createUrlTree(['/not-authorized']);
  }
}