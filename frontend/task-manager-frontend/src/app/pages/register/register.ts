import { AuthService } from './../../services/auth';
import { ChangeDetectorRef, Component,inject,ViewEncapsulation } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
  encapsulation: ViewEncapsulation.None
})
export class Register {
  username = '';
  password = '';
  confirmPassword='';
  email='';
  errorMessage='';
  successMessage='';
  private AuthService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  router = inject(Router);

  onSubmit() {
  this.errorMessage = '';
  this.successMessage = '';

  if (!this.username || !this.password || !this.email) {
    this.errorMessage = 'All fields are required';
    return;
  }
  if (this.password !== this.confirmPassword) {
    this.errorMessage = 'Passwords do not match';
    return; 
  }
  this.AuthService.register(this.username, this.password, this.confirmPassword, this.email).subscribe({
    next: (response: any) => {
      this.successMessage = 'Successfully registered! Redirecting...';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.router.navigate(['/login']); 
      }, 6000);
    },
    error: (err) => {
  if (err.status === 409) {
    this.errorMessage = err.error.message; 
  } else if (err.status === 400) {
    this.errorMessage = 'All fields are required';
  } else {
    this.errorMessage = 'Something went wrong. Try again.';
  }
  this.cdr.detectChanges();
}
  });
}
}
