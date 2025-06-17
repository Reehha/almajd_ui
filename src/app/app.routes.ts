import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
// import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { EmployeeDashboardComponent } from './component/manage-employee-dashboard/manage-employee-dashboard.component';
import { LogAttendanceComponent } from './component/log-attendance/log-attendance.component';
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';
import { QrScannerComponent } from './component/qr-scanner/qr-scanner.component';
import { RegisterComponent } from './component/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  /* ---------- Public routes (no authentication) ---------- */
  { path: 'login',    component: LoginComponent },
  { path: 'scan-qr',  component: QrScannerComponent },

  /* ---------- Auth‑protected routes ---------- */
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'manage',
    component: EmployeeDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee', 'manager'] }
  },
  {
    path: 'log-attendance',
    component: LogAttendanceComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['employee'] }
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },

  /* ---------- Fallback ---------- */
  { path: '**', redirectTo: '/login' }
];
