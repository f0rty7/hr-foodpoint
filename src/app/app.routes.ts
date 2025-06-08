import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./features/homepage/homepage.routes').then(m => m.homepageRoutes)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  }
];
