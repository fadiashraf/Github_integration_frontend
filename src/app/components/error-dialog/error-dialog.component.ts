import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-error-dialog',
  imports: [MatDialogModule],
  templateUrl: './error-dialog.component.html',
  styleUrl: './error-dialog.component.scss'
})


export class ErrorDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { message: string },
    private dialogRef: MatDialogRef<ErrorDialogComponent>
  ) { }

  close (): void {
    this.dialogRef.close();
  }
}
