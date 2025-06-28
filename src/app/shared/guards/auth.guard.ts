import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Functional auth guard that protects routes requiring authentication.
 * Uses Angular v20's functional guard pattern with dependency injection.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated using the computed signal
  if (authService.isAuthenticated()) {
    return true;
  }

  // If not authenticated, redirect to signin page
  // Store the attempted URL for redirecting after login
  const currentUrl = router.getCurrentNavigation()?.initialUrl.toString();
  if (currentUrl) {
    // You could store this URL in a service or localStorage to redirect after login
    localStorage.setItem('redirectUrl', currentUrl);
  }

  // Redirect to signin page
  router.navigate(['/auth/signin']);
  return false;
};
