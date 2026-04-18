import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tasks`;

  getMyTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.base}/my`);
  }

  startTask(taskId: string): Observable<Task> {
    return this.http.put<Task>(`${this.base}/${taskId}/start`, {});
  }

  completeTask(taskId: string, notes: string, attachments?: File[]): Observable<Task> {
    if (attachments && attachments.length > 0) {
      const form = new FormData();
      form.append('notes', notes);
      attachments.forEach(f => form.append('attachments', f, f.name));
      return this.http.put<Task>(`${this.base}/${taskId}/complete`, form);
    }
    return this.http.put<Task>(`${this.base}/${taskId}/complete`, { notes });
  }
}
