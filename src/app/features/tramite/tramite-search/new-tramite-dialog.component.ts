import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Policy } from '../../../core/models/policy.model';

@Component({
  selector: 'app-new-tramite-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Nuevo Trámite</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline">
          <mat-label>Política</mat-label>
          <mat-select formControlName="policyId">
            @for (p of data.policies; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Nombre del cliente</mat-label>
          <input matInput formControlName="clientName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Contacto</mat-label>
          <input matInput formControlName="clientContact" placeholder="email o teléfono" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(null)">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="dialogRef.close(form.value)">
        Crear
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-form { display: flex; flex-direction: column; gap: 8px; min-width: 320px; padding-top: 8px; }`]
})
export class NewTramiteDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<NewTramiteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { policies: Policy[] }
  ) {
    this.form = this.fb.group({
      policyId: ['', Validators.required],
      clientName: ['', Validators.required],
      clientContact: ['', Validators.required]
    });
  }
}
