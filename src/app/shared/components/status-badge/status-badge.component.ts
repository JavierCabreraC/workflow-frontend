import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusLabelPipe } from '../../pipes/status-label.pipe';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, StatusLabelPipe],
  template: `
    <span class="badge" [ngClass]="colorClass">{{ status | statusLabel }}</span>
  `,
  styles: [`
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .pending   { background: #fdecea; color: #c62828; }
    .in_progress { background: #fff8e1; color: #f57f17; }
    .completed, .done { background: #e8f5e9; color: #2e7d32; }
    .draft     { background: #f5f5f5; color: #616161; }
    .active    { background: #e3f2fd; color: #1565c0; }
    .inactive  { background: #f5f5f5; color: #9e9e9e; }
    .rejected  { background: #fff3e0; color: #e65100; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = '';

  get colorClass(): string {
    return this.status.toLowerCase().replace('_', '_');
  }
}
