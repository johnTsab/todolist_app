import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService} from '../services/auth';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

   const token = localStorage.getItem('accessToken');
   const reqWithToken = token ? req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }) : req;

  return next(reqWithToken).pipe(
    catchError((error) => {
      // 2. Αν πάρουμε 403, προσπάθησε να ανανεώσεις το token
      if (error.status === 403) {
        return authService.refresh().pipe(
          switchMap((response: any) => {
            // Πήρες νέο token — αποθήκευσέ το
            localStorage.setItem('accessToken', response.accessToken);
            // Ξανακάνε το αρχικό request με το νέο token
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${response.accessToken}` }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Το refresh απέτυχε — πήγαινε στο login
            localStorage.removeItem('accessToken');
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );

};
