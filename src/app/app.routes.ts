import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'databases' },
  { path: 'databases', loadComponent: () => import('./features/database/pages/database-selection.page').then(m => m.DatabaseSelectionPage) },
  { path: 'tables/:id', loadComponent: () => import('./features/database/pages/table-selection.page').then(m => m.TableSelectionPage) },
  { path: 'report-builder', loadComponent: () => import('./features/reporting/pages/report-builder.page').then(m => m.ReportBuilderPage) },
  { path: 'chart-viewer', loadComponent: () => import('./features/reporting/pages/chart-viewer.page').then(m => m.ChartViewerPage) },
  { path: 'legacy', loadComponent: () => import('./pages/reporting/reporting.component').then(m => m.ReportingComponent) },
  { path: '**', redirectTo: 'databases' },
];
