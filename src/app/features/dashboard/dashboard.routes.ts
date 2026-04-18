import { Routes } from '@angular/router';
import { TaskMonitorComponent } from './task-monitor/task-monitor.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';

export const dashboardRoutes: Routes = [
  { path: '', component: TaskMonitorComponent },
  { path: 'task/:id', component: TaskDetailComponent }
];
