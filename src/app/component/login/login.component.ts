import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LoginService } from '../../services/login.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  empid = '';
  password = '';
  errorMessage = '';
  showPassword = false;

  constructor(private router: Router, private service: LoginService) { }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const isDigit = /\d/.test(event.key);
    if (!isDigit) {
      event.preventDefault();
    }
  }

  login(form: NgForm) {
    if (form.invalid) return;

    const payload = {
      employeeId: this.empid,
      password: this.password
    };

    this.service.login(payload).subscribe({
      next: (wrapper: any) => {
        // backend wraps every success body under { ... , data: <payload>, ... }
        const userData = wrapper?.data?.data;
        if (!userData) {
          this.errorMessage = 'Username or password incorrect';
          return;
        }

        const accessToken = userData.accessToken;
        const roles = userData.roles;
        const firstName = userData.firstName;
        const lastName = userData.lastName;
        const employeeId = userData.employeeId;


        if (!roles) {
          this.errorMessage = 'Login failed: incomplete data';
          return;
        }

        // persist auth info
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('roles', roles);
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('lastName', lastName);
        localStorage.setItem('employeeId', employeeId);


        // route by role
          if (roles.includes('admin')) {
            this.service.setSession(accessToken, roles);
            this.router.navigateByUrl('/admin-dashboard');
          } else if (roles.some((r: string) => ['employee', 'office-staff', 'site-worker', 'factory-worker'].includes(r))) {
            this.service.setSession(accessToken, roles);
            this.router.navigateByUrl('/employee-dashboard');
          } else {
            this.errorMessage = 'Unknown role';
        }
      },
      error: () => {
        this.errorMessage = 'Invalid employee id or password';
      }
    });
  }
}
