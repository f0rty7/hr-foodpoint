import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

export interface SigninRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE_URL = environment.apiUrl;

  // Reactive signals for auth state
  private currentUserSignal = signal<AuthUser | null>(null);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Public readonly signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAuthenticated = () => !!this.currentUserSignal();

  constructor(private router: Router) {
    // Check for existing token on service initialization
    this.checkExistingAuth();
  }

  private checkExistingAuth() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token and get user info
      this.verifyToken(token);
    }
  }

  private async verifyToken(token: string) {
    try {
      console.log('Verifying token on page refresh...');
      const response = await fetch(`${this.API_BASE_URL}auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        console.log('Token verification successful, user data:', data);
        this.currentUserSignal.set({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone
        });
      } else {
        console.warn('Token verification failed with status:', response.status);
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
        this.currentUserSignal.set(null);
      }
    } catch (error) {
      console.warn('Token verification failed with error:', error);
      localStorage.removeItem('auth_token');
      this.currentUserSignal.set(null);
    }
  }

  async signin(credentials: SigninRequest): Promise<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await fetch(`${this.API_BASE_URL}auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        // Store token - use accessToken from backend response
        localStorage.setItem('auth_token', data.accessToken);

        // Update user state
        this.currentUserSignal.set(data.user);

        // Navigate to home
        this.router.navigate(['/home']);

        return true;
      } else {
        this.errorSignal.set(data.message || 'Login failed');
        return false;
      }
    } catch (error) {
      this.errorSignal.set('Network error. Please try again.');
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async signup(userData: SignupRequest): Promise<boolean> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const response = await fetch(`${this.API_BASE_URL}auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data: AuthResponse = await response.json();

      if (response.ok) {
        // Store token - use accessToken from backend response
        localStorage.setItem('auth_token', data.accessToken);

        // Update user state
        this.currentUserSignal.set(data.user);

        // Navigate to home
        this.router.navigate(['/home']);

        return true;
      } else {
        this.errorSignal.set(data.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      this.errorSignal.set('Network error. Please try again.');
      return false;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async signout(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Call logout endpoint
        await fetch(`${this.API_BASE_URL}auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('auth_token');
      this.currentUserSignal.set(null);
      this.router.navigate(['/auth/signin']);
    }
  }

  clearError() {
    this.errorSignal.set(null);
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }
}
