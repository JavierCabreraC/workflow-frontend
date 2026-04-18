import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    @if (user$ | async; as user) {
      <nav class="sidebar">
        <mat-nav-list>
          @if (user.role === 'ADMIN') {
            <a mat-list-item routerLink="/editor" routerLinkActive="active">
              <mat-icon matListItemIcon>policy</mat-icon>
              <span matListItemTitle>Políticas</span>
            </a>
            <a mat-list-item routerLink="/analytics" routerLinkActive="active">
              <mat-icon matListItemIcon>analytics</mat-icon>
              <span matListItemTitle>Analytics</span>
            </a>
          }
          @if (user.role === 'FUNCIONARIO') {
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Mi Monitor</span>
            </a>
          }
          <a mat-list-item routerLink="/tramites" routerLinkActive="active">
            <mat-icon matListItemIcon>folder_shared</mat-icon>
            <span matListItemTitle>Trámites</span>
          </a>
        </mat-nav-list>
      </nav>
    }
  `,
  styles: [`
    .sidebar {
      width: 220px;
      height: 100%;
      background: #fafafa;
      border-right: 1px solid #e0e0e0;
      padding-top: 8px;
    }
    .active { background: rgba(25, 118, 210, 0.12); }
  `]
})
export class SidebarComponent {
  user$ = inject(AuthService).currentUser$;
}
