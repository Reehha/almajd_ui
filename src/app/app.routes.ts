import { Routes } from '@angular/router';
import { LoginComponent } from './component/login/login.component';
import { EmployeeMenuComponent } from './component/employee-dashboard/employee-dashboard.component';
import { LogAttendanceComponent } from './component/log-attendance/log-attendance.component';
import { EmployeeDashboardComponent } from './component/manage-employee-dashboard/manage-employee-dashboard.component';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'
import { AdminDashboardComponent } from './component/admin-dashboard/admin-dashboard.component';
import { QrScannerComponent } from './component/qr-scanner/qr-scanner.component';



export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'employee', component: EmployeeMenuComponent },
  { path: 'manage', component: EmployeeDashboardComponent },
  { path: 'log-attendance', component: LogAttendanceComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  { path: 'scan-qr', component: QrScannerComponent },
];
@NgModule({
  imports: [
    FormsModule, // Add FormsModule here
  ],
  providers: [],
  bootstrap: [],
})

export class AppRoutingModule {}