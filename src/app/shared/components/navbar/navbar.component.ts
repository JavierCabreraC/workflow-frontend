import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="brand">Workflow</span>
      <span class="spacer"></span>
      @if (user$ | async; as user) {
        <span class="user-info">
          <span class="user-name">{{ user.name }}</span>
          <span class="role-badge" [ngClass]="'role-' + user.role.toLowerCase()">{{ user.role }}</span>
        </span>
        <button mat-icon-button (click)="logout()" title="Cerrar sesión">
          <mat-icon>logout</mat-icon>
        </button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .navbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
    .brand { font-size: 1.2rem; font-weight: 700; letter-spacing: 0.05em; }
    .spacer { flex: 1; }
    .user-info { display: flex; align-items: center; gap: 8px; margin-right: 8px; }
    .user-name { font-size: 0.9rem; }
    .role-badge {
      padding: 2px 8px; border-radius: 10px; font-size: 0.7rem;
      font-weight: 700; text-transform: uppercase;
    }
    .role-admin      { background: #c62828; color: #fff; }
    .role-funcionario { background: #1565c0; color: #fff; }
    .role-cliente    { background: #2e7d32; color: #fff; }
  `]
})
export class NavbarComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  user$ = this.auth.currentUser$;

  logout(): void {
    this.auth.logout();
  }
}
