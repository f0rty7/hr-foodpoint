import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1 class="auth-title">Create Account</h1>
          <p class="auth-subtitle">Join us today</p>
        </div>

        @if (authService.error()) {
          <div class="auth-error">
            {{ authService.error() }}
          </div>
        }

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="name" class="form-label">Full Name</label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="form-input"
              [class.error]="isFieldInvalid('name')"
              placeholder="Enter your full name"
            />
            @if (isFieldInvalid('name')) {
              <span class="error-message">Name is required</span>
            }
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="form-input"
              [class.error]="isFieldInvalid('email')"
              placeholder="Enter your email"
            />
            @if (isFieldInvalid('email')) {
              <span class="error-message">Please enter a valid email</span>
            }
          </div>

          <div class="form-group">
            <label for="phone" class="form-label">Phone Number</label>
            <input
              id="phone"
              type="tel"
              formControlName="phone"
              class="form-input"
              [class.error]="isFieldInvalid('phone')"
              placeholder="Enter your phone number"
            />
            @if (isFieldInvalid('phone')) {
              <span class="error-message">Phone number is required</span>
            }
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="form-input"
              [class.error]="isFieldInvalid('password')"
              placeholder="Create a password"
            />
            @if (isFieldInvalid('password')) {
              <span class="error-message">Password must be at least 6 characters</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="form-input"
              [class.error]="isFieldInvalid('confirmPassword') || hasPasswordMismatch()"
              placeholder="Confirm your password"
            />
            @if (isFieldInvalid('confirmPassword')) {
              <span class="error-message">Please confirm your password</span>
            }
            @if (hasPasswordMismatch()) {
              <span class="error-message">Passwords do not match</span>
            }
          </div>

          <div class="form-options">
            <label class="checkbox-container">
              <input type="checkbox" formControlName="agreeToTerms">
              <span class="checkmark"></span>
              I agree to the <a href="#" class="terms-link">Terms & Conditions</a>
            </label>
          </div>

          <button
            type="submit"
            class="auth-button"
            [disabled]="signupForm.invalid || authService.isLoading()"
          >
            @if (authService.isLoading()) {
              <span class="loading-spinner"></span>
              Creating account...
            } @else {
              Create Account
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/signin" class="auth-link">Sign in</a></p>
        </div>
      </div>
    </div>
  `,
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signupForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    });

    // Add custom validator for password confirmation
    this.signupForm.get('confirmPassword')?.setValidators([
      Validators.required,
      this.passwordMatchValidator.bind(this)
    ]);
  }

  passwordMatchValidator(control: any) {
    const password = this.signupForm?.get('password')?.value;
    const confirmPassword = control.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  hasPasswordMismatch(): boolean {
    const confirmPasswordField = this.signupForm.get('confirmPassword');
    return !!(confirmPasswordField?.hasError('passwordMismatch') &&
             (confirmPasswordField?.dirty || confirmPasswordField?.touched));
  }

    async onSubmit() {
    if (this.signupForm.valid) {
      const formValue = this.signupForm.value;
      const success = await this.authService.signup({
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
        password: formValue.password
      });

      if (!success) {
        // Error handling is managed by the service
        console.log('Sign up failed');
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
    }
  }
}
