import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { isPlatformBrowser } from '@angular/common';

interface LoginRequest {
  employeeId: string;
  password: string;
}

interface LoginResponse {
  data: {
    data: {
      accessToken: string;
      roles: string[];
      firstName?: string;
      lastName?: string;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  private readonly STORAGE_KEY = 'almajd-token';
  private readonly BASE_URL = environment.api;
  private storage: Storage | null = null;
  private loggedIn = false;
  private currentRoles: string[] = [];

  /** last known user (null when logged-out) */
  private currentUserSubject =
    new BehaviorSubject<LoginResponse | null>(this.readStored());

  /** emits after every login / logout so components can refresh UI */
  private authChangedSubject = new BehaviorSubject<void>(undefined);
  public readonly authChanged = this.authChangedSubject.asObservable();

  /** observable for components/guards */
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient,
    private router: Router, @Inject(PLATFORM_ID) private platformId: any) {
    if (isPlatformBrowser(this.platformId)) {
      this.storage = window.localStorage;
    }
  }

  setSession(token: string, roles: string[]) {
    this.loggedIn = true;
    this.currentRoles = roles;
  }

  getRoles(): string[] {
    return this.currentRoles;
  }


  login(req: LoginRequest) {
    return this.http.post<LoginResponse>(
      `${this.BASE_URL}/auth/login`, req
    )
      .pipe(
        tap(res => {
          this.store(res);
          const user = res?.data?.data;
          if (user?.firstName && user?.lastName) {
            const defaultPassword = `${user.firstName}.${user.lastName}`;
            if (req.password === defaultPassword) {
              this.storage?.setItem('mustResetPassword', 'true');
              this.router.navigate(['/reset-password']);
            } else {
              this.storage?.removeItem('mustResetPassword');
            }
          }
        }),
        catchError(err => {
          return of(err.error ?? { message: 'Login failed' });
        })
      );
  }

  logout() {

    const token = this.getToken();
    if (!token) {
      this.clear();
      return of(null);
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`);

    return this.http.post<void>(`${this.BASE_URL}/auth/logout`, null, { headers })
      .pipe(
        // whether it returns 204 or 409, we clear the local state
        catchError(() => of(null)),
        tap(() => this.clear()),
        tap(() => this.router.navigateByUrl('/login'))
      );
  }

  /** Save in localStorage & update stream */
  private store(u: LoginResponse) {
    this.storage?.setItem(this.STORAGE_KEY, JSON.stringify(u));
    this.currentUserSubject.next(u);
    this.authChangedSubject.next();
  }

  /** Read from storage (or null) */
  private readStored(): LoginResponse | null {
    const raw = this.storage?.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) as LoginResponse : null;
  }

  /** Remove ALL tokens & notify */
  private clear() {
    this.storage?.clear();
    this.currentUserSubject.next(null);
    this.authChangedSubject.next();
  }

  /** convenience */
  getToken(): string | null {
    return this.currentUserSubject.value?.data?.data?.accessToken ?? null;
  }

  hasRole(role: string): boolean {
    return this.currentUserSubject.value?.data?.data?.roles.includes(role) ?? false;
  }

  /** do we have a non-expired JWT in storage? */
  public isLoggedIn(): boolean {
    // localStorage might not exist on the server-side (SSR, tests, etc.)
    if (!this.storage) { return false; }

    // read the JSON wrapper we stored earlier
    const raw = this.storage.getItem(this.STORAGE_KEY);
    if (!raw) { return false; }

    try {
      // it’s a JSON string → parse it to get the real token
      const saved: LoginResponse = JSON.parse(raw);
      const accessToken = saved?.data?.data?.accessToken;
      if (!accessToken) { return false; }

      // decode the JWT and verify the exp claim
      const { exp } = jwtDecode<{ exp: number }>(accessToken);
      return exp * 1000 > Date.now();      // still valid?
    } catch {
      // malformed JSON or not a JWT – treat as not logged-in
      return false;
    }
  }

  /** does the current token carry any of the roles? */
  public hasAnyRole(required: string[]): boolean {
    const t = this.storage?.getItem(this.STORAGE_KEY);
    if (!t) { return false; }

    try {
      var data = JSON.parse(t);
      const { roles } = data?.data?.data;
      return roles?.some((r: string) => required.includes(r)) ?? false;
    } catch {
      return false;
    }
  }

  public getEmployeeId(): string | null {
    const token = this.getToken();
    if (!token) { return null; }

    try {
      const { preferred_username } = jwtDecode<{ preferred_username: string }>(token);
      return preferred_username ?? null;
    } catch {
      return null;
    }
  }

}
