import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
// import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { EmployeeDashboardComponent } from './component/manage-employee-dashboard/manage-employee-dashboard.component';
import { LogAttendanceComponent } from './component/log-attendance/log-attendance.component';
import { QrScannerComponent } from './component/qr-scanner/qr-scanner.component';
import { RegisterComponent } from './component/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { ProfileComponent } from './component/profile/profile.component';
import { ResetPasswordComponent } from './component/reset-password/reset-password.component';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  /* ---------- Public routes (no authentication) ---------- */
  { path: 'login',    component: LoginComponent },
  { path: 'scan-qr',  component: QrScannerComponent },

  /* ---------- Auth‑protected routes ---------- */
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'manage',
    component: EmployeeDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['employee', 'manager'] }
  },
  {
    path: 'log-attendance',
    component: LogAttendanceComponent,
    canActivate: [AuthGuard],
    data: { roles: ['employee'] }
  },
  {
    path: 'admin-dashboard',
    canActivate: [AuthGuard],
    component: AdminDashboardComponent,
    data: { roles: ['admin'] }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { roles: ['employee'] }
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [ResetPasswordGuard]
  },

  /* ---------- Fallback ---------- */
  { path: '**', redirectTo: '/login' }
];
