import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'editor',
    loadChildren: () =>
      import('./features/policy-editor/policy-editor.routes').then(m => m.policyEditorRoutes),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [authGuard, roleGuard('FUNCIONARIO')]
  },
  {
    path: 'tramites',
    loadChildren: () =>
      import('./features/tramite/tramite.routes').then(m => m.tramiteRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadChildren: () =>
      import('./features/analytics/analytics.routes').then(m => m.analyticsRoutes),
    canActivate: [authGuard, roleGuard('ADMIN')]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
