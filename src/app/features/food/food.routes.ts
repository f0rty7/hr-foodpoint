import { Routes } from '@angular/router';

export const foodRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing/food-home.component').then(m => m.FoodHomeComponent)
  },
  {
    path: 'order',
    loadComponent: () => import('./components/menu/menu.component').then(c => c.MenuListingComponent)
  }
];
