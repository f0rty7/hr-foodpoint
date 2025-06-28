import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  {
    path: 'signin',
    loadComponent: () => import('./components/signin/signin.component').then(c => c.SigninComponent),
  },
  {
    path: 'signup',
    loadComponent: () => import('./components/signup/signup.component').then(c => c.SignupComponent)
  },
  {
    path: '',
    redirectTo: 'signin',
    pathMatch: 'full'
  }
];
