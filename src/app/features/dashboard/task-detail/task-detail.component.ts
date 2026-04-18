import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss'
})
export class TaskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private taskService = inject(TaskService);
  private fb = inject(FormBuilder);

  task: Task | null = null;
  loading = true;
  saving = false;
  attachments: File[] = [];

  form = this.fb.group({
    notes: ['', [Validators.required, Validators.minLength(3)]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.taskService.getMyTasks().subscribe({
      next: tasks => {
        this.task = tasks.find(t => t.id === id) ?? null;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.attachments = input.files ? Array.from(input.files) : [];
  }

  complete(): void {
    if (this.form.invalid || !this.task) return;
    this.saving = true;
    const notes = this.form.value.notes!;
    this.taskService.completeTask(this.task.id, notes, this.attachments).subscribe({
      next: () => { this.router.navigate(['/dashboard']); },
      error: () => { this.saving = false; }
    });
  }
}
