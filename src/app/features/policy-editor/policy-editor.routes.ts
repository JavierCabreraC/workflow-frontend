import { Routes } from '@angular/router';

export const policyEditorRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./policy-list/policy-list.component').then(m => m.PolicyListComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./editor-shell/editor-shell.component').then(m => m.EditorShellComponent),
  },
];
