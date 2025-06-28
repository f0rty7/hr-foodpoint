import { Injectable, signal, resource, computed } from '@angular/core';
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

  // Signals for triggering auth operations
  private shouldVerifyUser = signal(true);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Resource for verifying authentication token and getting user data
  readonly userResource = resource({
    loader: async ({ abortSignal }) => {
      const token = localStorage.getItem('auth_token');

      if (!token || !this.shouldVerifyUser()) {
        return null;
      }

      try {
        if (environment.enableLogging) {
          console.log('Verifying token with Resource API...');
        }

        const response = await fetch(`${this.API_BASE_URL}auth/me`, {
          signal: abortSignal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token is invalid, remove it
            localStorage.removeItem('auth_token');
            this.shouldVerifyUser.set(false);
            throw new Error('Authentication token expired or invalid');
          }
          throw new Error(`Authentication verification failed: ${response.status}`);
        }

        const data = await response.json();

        if (environment.enableLogging) {
          console.log('Token verification successful, user data:', data);
        }

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone
        } as AuthUser;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        console.warn('Token verification failed:', error);
        localStorage.removeItem('auth_token');
        this.shouldVerifyUser.set(false);
        throw error;
      }
    }
  });



  // Computed signals for reactive state
  readonly currentUser = computed(() => this.userResource.value());
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isLoading = computed(() => this.userResource.isLoading() || this.isLoadingSignal());
  readonly error = computed(() => this.userResource.error() || this.errorSignal());

  constructor(private router: Router) {}

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
        // Store token and trigger user verification
        localStorage.setItem('auth_token', data.accessToken);
        this.shouldVerifyUser.set(true);
        this.userResource.reload();

        // Check for redirect URL
        const redirectUrl = localStorage.getItem('redirectUrl');
        if (redirectUrl) {
          localStorage.removeItem('redirectUrl');
          this.router.navigateByUrl(redirectUrl);
        } else {
          // Default navigation
          this.router.navigate(['/home']);
        }

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
        // Store token and trigger user verification
        localStorage.setItem('auth_token', data.accessToken);
        this.shouldVerifyUser.set(true);
        this.userResource.reload();

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
      const token = this.getAuthToken();
      if (token) {
        // Call logout endpoint
        await fetch(`${this.API_BASE_URL}auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('auth_token');
      this.shouldVerifyUser.set(false);
      this.router.navigate(['/auth/signin']);
    }
  }

  clearError(): void {
    this.errorSignal.set(null);
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Method to refresh user data
  refreshUser(): void {
    this.shouldVerifyUser.set(true);
    this.userResource.reload();
  }

  // Convenience getters for resource states
  get hasError(): boolean {
    return !!(this.userResource.error() || this.errorSignal());
  }

  get isUserLoading(): boolean {
    return this.userResource.isLoading();
  }
}
