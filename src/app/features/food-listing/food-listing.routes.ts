import { Routes } from '@angular/router';

export const foodListingRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/food-home/food-home.component').then(m => m.FoodHomeComponent)
  },
  {
    path: 'list',
    loadComponent: () => import('./food-listing.component').then(c => c.FoodListingComponent)
  },
  // {
  //   path: 'categories',
  //   loadComponent: () => import('./components/food-categories/food-categories.component').then(m => m.FoodCategoriesComponent)
  // },
  // {
  //   path: 'popular',
  //   loadComponent: () => import('./components/food-popular/food-popular.component').then(m => m.FoodPopularComponent)
  // },
  // {
  //   path: 'specials',
  //   loadComponent: () => import('./components/food-specials/food-specials.component').then(m => m.FoodSpecialsComponent)
  // },
  // {
  //   path: 'recent',
  //   loadComponent: () => import('./components/food-recent/food-recent.component').then(m => m.FoodRecentComponent)
  // }
];
