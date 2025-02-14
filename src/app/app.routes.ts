import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'floor-plan',
    loadComponent: () => import('./components/floor-plan/floor-plan.component').then(m => m.FloorPlanComponent)
  }
]; 