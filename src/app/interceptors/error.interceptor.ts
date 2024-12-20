import { HttpInterceptorFn } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);

      // Extract error message
      let errorMessage = 'An unexpected error occurred';
      if (error.error && typeof error.error === 'string') {
        errorMessage = error.error; // Message from server
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message; // Nested message in server response
      } else if (error.message) {
        errorMessage = error.message; // Default error message
      }

      // Show a snackbar with the error message
      snackBar.open(
        `Error ${error.status}: ${errorMessage}`,
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        }
      );

      // Re-throw the error to propagate it further if needed
      return throwError(() => error);
    })
  );
};
