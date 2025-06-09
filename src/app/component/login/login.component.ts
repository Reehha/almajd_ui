import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone:true,
  imports:[FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    const payload = {
      username: this.username,
      password: this.password
    };

    this.http.post<any>('http://localhost:8081/auth/token', payload)
      .subscribe({
        next: (response) => {

          // Optionally store token in localStorage for later use
          localStorage.setItem('token', response.access_token);

          // Redirect to dashboard or home
          this.router.navigate(['/admin-dashboard']); // 👈 make sure this route exists
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.errorMessage = 'Invalid username or password';
        }
      });
  }
}
