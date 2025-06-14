import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/profile.component').then(c => c.ProfileComponent)
  }
];
