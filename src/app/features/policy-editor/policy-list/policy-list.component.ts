import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PolicyService } from '../../../core/services/policy.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Policy, PolicyStatus } from '../../../core/models/policy.model';
import { CreatePolicyDialogComponent } from './create-policy-dialog.component';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatChipsModule, MatTooltipModule, MatProgressSpinnerModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './policy-list.component.html',
  styleUrl: './policy-list.component.scss',
})
export class PolicyListComponent implements OnInit {
  private policyService = inject(PolicyService);
  private notification  = inject(NotificationService);
  private router        = inject(Router);
  private dialog        = inject(MatDialog);

  policies: Policy[] = [];
  loading = true;
  columns = ['name', 'status', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.policyService.getPolicies().subscribe({
      next: (data) => { this.policies = data; this.loading = false; },
      error: () => { this.notification.error('Error al cargar políticas'); this.loading = false; },
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(CreatePolicyDialogComponent, { width: '440px' });
    ref.afterClosed().subscribe((result: { name: string; description: string } | undefined) => {
      if (!result) return;
      this.policyService.createPolicy(result.name, result.description).subscribe({
        next: (policy) => {
          this.notification.success('Política creada');
          this.router.navigate(['/editor', policy.id]);
        },
        error: () => this.notification.error('Error al crear política'),
      });
    });
  }

  editPolicy(id: string): void {
    this.router.navigate(['/editor', id]);
  }

  toggleStatus(policy: Policy): void {
    const newStatus: PolicyStatus = policy.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const action = newStatus === 'ACTIVE' ? 'activar' : 'desactivar';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { title: `${newStatus === 'ACTIVE' ? 'Activar' : 'Desactivar'} política`, message: `¿Deseas ${action} la política "${policy.name}"?` },
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.policyService.updateStatus(policy.id, newStatus).subscribe({
        next: (updated) => {
          const idx = this.policies.findIndex(p => p.id === policy.id);
          if (idx > -1) this.policies[idx] = updated;
          this.policies = [...this.policies];
          this.notification.success('Estado actualizado');
        },
        error: () => this.notification.error('Error al actualizar estado'),
      });
    });
  }

  deletePolicy(policy: Policy): void {
    if (policy.status !== 'DRAFT') {
      this.notification.error('Solo se pueden eliminar políticas en estado DRAFT');
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { title: 'Eliminar política', message: `¿Eliminar permanentemente "${policy.name}"?`, danger: true },
    });
    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.policyService.deletePolicy(policy.id).subscribe({
        next: () => { this.policies = this.policies.filter(p => p.id !== policy.id); this.notification.success('Política eliminada'); },
        error: () => this.notification.error('Error al eliminar política'),
      });
    });
  }
}
