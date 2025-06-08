import { Routes } from '@angular/router';

export const homepageRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./homepage.component').then(c => c.HomepageComponent)
  }
];
