import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-policy-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Nueva Política</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Proceso de contratación" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Describe el propósito de esta política"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="confirm()">
        <mat-icon>add</mat-icon> Crear y editar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; } .full-width { width: 100%; }`],
})
export class CreatePolicyDialogComponent {
  private ref = inject(MatDialogRef<CreatePolicyDialogComponent>);
  private fb  = inject(FormBuilder);

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });

  confirm(): void { this.ref.close(this.form.value); }
  cancel():  void { this.ref.close(); }
}
