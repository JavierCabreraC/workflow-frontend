import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TaskService } from '../../../core/services/task.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task } from '../../../core/models/task.model';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-task-monitor',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TimeAgoPipe],
  templateUrl: './task-monitor.component.html',
  styleUrl: './task-monitor.component.scss'
})
export class TaskMonitorComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private wsService = inject(WebsocketService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = true;
  pending: Task[] = [];
  inProgress: Task[] = [];
  completed: Task[] = [];

  ngOnInit(): void {
    this.loadTasks();
    const user = this.authService.currentUser$.value;
    if (user) {
      this.wsService.connect();
      this.wsService.subscribe(`/topic/tasks/${user.id}`, msg => {
        const task: Task = JSON.parse(msg.body);
        this.pending.unshift(task);
        this.updateTitle();
      });
    }
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
    document.title = 'Workflow';
  }

  private loadTasks(): void {
    this.taskService.getMyTasks().subscribe({
      next: tasks => {
        this.pending = tasks.filter(t => t.status === 'PENDING');
        this.inProgress = tasks.filter(t => t.status === 'IN_PROGRESS');
        this.completed = tasks.filter(t => t.status === 'COMPLETED');
        this.loading = false;
        this.updateTitle();
      },
      error: () => { this.loading = false; }
    });
  }

  atender(task: Task): void {
    this.taskService.startTask(task.id).subscribe({
      next: updated => {
        this.pending = this.pending.filter(t => t.id !== task.id);
        this.inProgress.unshift(updated);
        this.updateTitle();
        this.router.navigate(['/dashboard/task', task.id]);
      }
    });
  }

  private updateTitle(): void {
    const count = this.pending.length;
    document.title = count > 0 ? `(${count}) Workflow — Mi Monitor` : 'Workflow — Mi Monitor';
  }
}
