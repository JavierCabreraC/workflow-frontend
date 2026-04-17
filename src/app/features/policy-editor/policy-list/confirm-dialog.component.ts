import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface ConfirmData { title: string; message: string; danger?: boolean; }

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [style.color]="data.danger ? '#e53935' : '#1565c0'">
        {{ data.danger ? 'warning' : 'help_outline' }}
      </mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content><p>{{ data.message }}</p></mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="ref.close(false)">Cancelar</button>
      <button mat-flat-button [color]="data.danger ? 'warn' : 'primary'" (click)="ref.close(true)">
        Confirmar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`h2 { display: flex; align-items: center; gap: 8px; } p { margin: 0; }`],
})
export class ConfirmDialogComponent {
  ref  = inject(MatDialogRef<ConfirmDialogComponent>);
  data = inject<ConfirmData>(MAT_DIALOG_DATA);
}
