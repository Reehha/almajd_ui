import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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
  showPassword: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

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


    this.http.post<any>('http://localhost:8081/auth/login', payload).subscribe({
      next: (response) => {
        const innerData = response.data;
        if (innerData.message === 'Login successful') {
          const userData = innerData.data;
          const role = userData.roles[0];
          
          localStorage.setItem('accessToken', userData.accessToken);
          localStorage.setItem('role', role);
      
          if (role === 'admin') {
            this.router.navigate(['/admin-dashboard']);
          } else if (['employee', 'office-staff', 'site-worker', 'factory-worker'].includes(role)) {
            this.router.navigate(['/manage']);
          } else {
            this.errorMessage = 'Unknown role';
          }
        } else {
          this.errorMessage = 'Login failed: Unexpected response';
        }
      },
      
      error: (err) => {
        console.error('Login failed:', err);
        this.errorMessage = 'Invalid employee id or password';
      }
    });
  }
}
