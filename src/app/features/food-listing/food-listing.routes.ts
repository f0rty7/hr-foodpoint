import { Routes } from '@angular/router';

export const foodListingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./food-listing.component').then(c => c.FoodListingComponent)
  }
];
