import { Routes } from '@angular/router';

export const contactRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./contact.component').then(c => c.ContactComponent)
  }
];
