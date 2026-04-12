import { ChangeDetectorRef, Component,inject,ViewEncapsulation } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth';
import {Router} from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  encapsulation: ViewEncapsulation.None
})
export class Login {
  username = '';
  password = '';
  errorMessage='';
  private AuthService = inject(AuthService);
  router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  isLoading = false; 
  private apiUrl = environment.apiUrl;

  onSubmit(){
    this.errorMessage='';
    this.isLoading = true;
   this.AuthService.login(this.username, this.password).subscribe({
      next: (response: any) => {
        console.log('Login επιτυχές!', response);
        localStorage.setItem('accessToken',response.accessToken);
        console.log('Token saved:', localStorage.getItem('accessToken'));
        this.router.navigate(['/tasks']);
      },
      error: (err) => {
        if(err.status===401){ //unauthorized
          this.errorMessage='Wrong username or password!';
        }else{
          this.errorMessage='Something went wrong. Try again';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

   onGoogleLogin() {
    window.location.href = `${environment.apiUrl.replace('/api', '')}/api/auth/google`;
  }
 

  onLogout(){
    this.AuthService.logout().subscribe({
    next:()=>{
      this.router.navigate(['/login']);
    },
    error:(err)=>{
      console.error('Logout failed',err);
    }
  });
  }
}

