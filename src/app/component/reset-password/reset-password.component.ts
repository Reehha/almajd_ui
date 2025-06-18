import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasswordService } from '../../services/password.service';

@Component({
  selector: 'app-reset-password',
  imports:[FormsModule,CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.css']

})
export class ResetPasswordComponent {
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  errorMessage = '';
  showConfirmPassword = false;
  passwordMismatch = false;
  password='';

  constructor(private router: Router, private passwordService: PasswordService) {}




  checkPasswordMatch(): void {
    this.passwordMismatch = this.newPassword !== this.confirmPassword;

    // Clear global error if it was due to mismatch and it's now resolved
    if (!this.passwordMismatch && this.errorMessage === 'Passwords do not match') {
      this.errorMessage = '';
    }
  }

  private clear(){
    localStorage.clear();
  }

  resetPassword(form: any) {
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match";
      return;
    }
  
  
    this.passwordService.changePassword(this.newPassword).subscribe({
      next: () => {
        localStorage.removeItem('mustResetPassword');
        // localStorage.removeItem('accessToken');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = 'Failed to reset password. Please try again.';
        console.error(err);
      }
    });
  }
}
