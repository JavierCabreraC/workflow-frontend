import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('token');
        router.navigate(['/login']);
      } else if (error.status === 400 || error.status === 422) {
        const message = error.error?.message || 'Datos inválidos. Verifica los campos.';
        notification.error(message);
      } else if (error.status === 500) {
        notification.error('Error interno del servidor. Intenta de nuevo.');
      }
      return throwError(() => error);
    })
  );
};
