import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { MainEmployeeDashboardComponent } from './component/employee-dashboard/employee-dashboard.component';
import { ManageEmployeeDashboardComponent } from './component/manage-employee-dashboard/manage-employee-dashboard.component';
import { LogAttendanceComponent } from './component/log-attendance/log-attendance.component';
import { QrScannerComponent } from './component/qr-scanner/qr-scanner.component';
import { RegisterComponent } from './component/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { ProfileComponent } from './component/profile/profile.component';
import { ResetPasswordComponent } from './component/reset-password/reset-password.component';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';
import { EmployeeViewComponent } from './component/employee-view/employee-view.component';
import { UnderConstructionComponent } from './component/under-construction/under-construction.component';
import { QrScannerExitGuard } from './guards/qr-scanner-exit.guard';
import { EmployeeIdCardComponent } from './component/employee-id-card/employee-id-card.component';

export const routes: Routes = [
  /* ---------- Public routes (no authentication) ---------- */
  { path: 'login',    component: LoginComponent },

  /* ---------- Auth‑protected routes ---------- */
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  {
    path: 'manage',
    component: ManageEmployeeDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: [ 'admin'] }
  },
  {
    path: 'scan-qr',
    component: QrScannerComponent,
    canActivate: [AuthGuard],
    canDeactivate: [QrScannerExitGuard],
    data: { roles: [ 'qrScanner'] }
  },
  {
    path: 'employee-dashboard',
    component: MainEmployeeDashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['employee'] }
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
  {
    path: 'under-construction',
    component: UnderConstructionComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin','employee'] }
  },
  {
    path: 'employee-id-card/:employeeId/:firstName/:lastName',
    component: EmployeeIdCardComponent,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  

  /* ---------- Fallback ---------- */
  { path: '**', redirectTo: '/login' }
];
