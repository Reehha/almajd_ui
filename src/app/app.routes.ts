import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
// import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { EmployeeDashboardComponent } from './component/manage-employee-dashboard/manage-employee-dashboard.component';
import { LogAttendanceComponent } from './component/log-attendance/log-attendance.component';
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';
import { QrScannerComponent } from './component/qr-scanner/qr-scanner.component';
import { RegisterComponent } from './component/register/register.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent // No sidebar/header
  },
{ path: '', redirectTo: '/register', pathMatch: 'full' },
{ path: 'login', component: LoginComponent },
{ path: 'manage', component: EmployeeDashboardComponent },
{ path: 'log-attendance', component: LogAttendanceComponent },
{ path: 'admin-dashboard', component: AdminDashboardComponent },
{ path: 'scan-qr', component: QrScannerComponent },
{ path: 'register', component: RegisterComponent },
  // {
  //   path: 't',
  //   component: MainLayoutComponent, // Wrap with sidebar/header
  //   children: [
  //     { path: 'dashboard', component: EmployeeDashboardComponent },
  //     { path: 'attendance', component: LogAttendanceComponent },
  //     // add more authenticated routes here
  //   ]
  // },
  { path: '**', redirectTo: '' }
];
