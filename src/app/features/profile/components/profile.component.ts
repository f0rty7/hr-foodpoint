import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { HeaderComponent } from '../../homepage/components/header/header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, HeaderComponent],
  template: `
    <app-header></app-header>
    <div class="profile-container">
      <div class="profile-header">
        <h1 class="profile-title">User Profile</h1>
        <p class="profile-subtitle">Manage your account information</p>
      </div>

      <div class="profile-content">
        <!-- Profile Avatar Section -->
        <div class="profile-avatar-section">
          <div class="avatar-container">
            <div class="avatar">
              <span class="avatar-text">{{ getInitials() }}</span>
            </div>
            <button class="change-avatar-btn" type="button">
              Change Photo
            </button>
          </div>
        </div>

        <!-- Profile Form Section -->
        <div class="profile-form-section">
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
            <div class="form-grid">
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
                  readonly
                />
                <small class="field-note">Email cannot be changed</small>
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
                <label for="role" class="form-label">Role</label>
                <input
                  id="role"
                  type="text"
                  formControlName="role"
                  class="form-input"
                  placeholder="Your role"
                  readonly
                />
                <small class="field-note">Role is assigned by admin</small>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="resetForm()"
                [disabled]="isLoading()"
              >
                Reset
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="profileForm.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <span class="loading-spinner"></span>
                  Updating...
                } @else {
                  Update Profile
                }
              </button>
            </div>
          </form>
        </div>

        <!-- Account Settings Section -->
        <div class="account-settings-section">
          <h2 class="section-title">Account Settings</h2>
          <div class="settings-grid">
            <div class="setting-item">
              <div class="setting-info">
                <h3>Change Password</h3>
                <p>Update your password to keep your account secure</p>
              </div>
              <button class="btn btn-outline" type="button" (click)="showChangePassword()">
                Change Password
              </button>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3>Account Status</h3>
                <p>Your account is currently active</p>
              </div>
              <span class="status-badge active">Active</span>
            </div>

            <div class="setting-item">
              <div class="setting-info">
                <h3>Member Since</h3>
                <p>{{ getFormattedDate() }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  profileForm: FormGroup;
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s-()]+$/)]],
      role: ['']
    });

    this.loadUserData();
  }

  private loadUserData() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: ''
      });
    }
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  }

  getFormattedDate(): string {
    // This would come from user data in real implementation
    return 'January 2024';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  resetForm() {
    this.loadUserData();
  }

  showChangePassword() {
    // This would open a change password modal or navigate to change password page
    alert('Change password functionality would be implemented here');
  }

  async onSubmit() {
    if (this.profileForm.valid) {
      this.isLoading.set(true);
      this.error.set(null);

      try {
        // Here you would call a profile update service
        const formValue = this.profileForm.value;
        console.log('Updating profile:', formValue);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Success feedback
        alert('Profile updated successfully!');
      } catch (error) {
        this.error.set('Failed to update profile. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
    }
  }
}
