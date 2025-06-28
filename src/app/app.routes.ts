import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

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
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'food',
    loadChildren: () => import('./features/food-listing/food-listing.routes').then(m => m.foodListingRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'contact',
    loadChildren: () => import('./features/contact/contact.routes').then(m => m.contactRoutes)
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  }
];
