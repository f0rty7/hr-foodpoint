import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./features/homepage/homepage.routes').then(m => m.homepageRoutes)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  }
];
