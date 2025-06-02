import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone:true,
  imports:[FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';

  constructor(private router: Router) {}

  login() {
    if (this.username === 'employee' && this.password === 'employee') {
      this.router.navigate(['/employee']);
    } else if (this.username === 'admin' && this.password === 'admin') {
      this.router.navigate(['/admin-dashboard']);
    } else {
      alert('Invalid credentials');
    }
  }

}