import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/reporting/reporting.component').then(m => m.ReportingComponent) },
  { path: '**', redirectTo: '' },
];
