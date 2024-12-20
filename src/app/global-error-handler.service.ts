import { ErrorHandler, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private snackBar: MatSnackBar) {}

  handleError(error: any): void {
    console.error('Global Error Handler:', error);

    // Show snackbar with error message
    this.snackBar.open(
      'An unexpected error occurred. Please try again later.',
      'Close',
      {
        duration: 5000, // 5 seconds
        horizontalPosition: 'center',
        verticalPosition: 'top',
      }
    );
  }
}
