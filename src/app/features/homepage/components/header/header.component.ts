import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatMenuModule, MatButtonModule, MatIconModule, MatDividerModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="logo">
          LOGO
        </div>

        <!-- Desktop Navigation -->
        <nav class="navigation desktop-nav">
          <a class="nav-link" routerLink="/">Home</a>
          <div class="nav-dropdown">
            <button mat-button [matMenuTriggerFor]="servicesMenu" class="nav-link services-trigger">
              Services
            </button>
            <mat-menu #servicesMenu="matMenu">
              <button mat-menu-item>Food</button>
              <button mat-menu-item>Job Search</button>
            </mat-menu>
          </div>
                      <a href="#" class="nav-link">About</a>
            @if (authService.isAuthenticated()) {
              <div class="user-menu">
                <button
                  mat-button
                  [matMenuTriggerFor]="userDropdown"
                  class="user-button"
                >
                  <mat-icon>account_circle</mat-icon>
                  <mat-icon>keyboard_arrow_down</mat-icon>
                  <span>{{ authService.currentUser()?.name }}</span>
                </button>
                <mat-menu #userDropdown="matMenu">
                  <button mat-menu-item routerLink="/profile">
                    <mat-icon>person</mat-icon>
                    <span>Profile</span>
                  </button>
                  <button mat-menu-item>
                    <mat-icon>settings</mat-icon>
                    <span>Settings</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="authService.signout()">
                    <mat-icon>logout</mat-icon>
                    <span>Logout</span>
                  </button>
                </mat-menu>
              </div>
            } @else {
              <a routerLink="/auth/signin" class="nav-link login-btn">Login</a>
            }
        </nav>

        <!-- Mobile Menu Toggle -->
        <button
          mat-icon-button
          class="mobile-menu-toggle"
          (click)="toggleMobileMenu()"
          aria-label="Toggle mobile menu">
          <mat-icon>{{ isMobileMenuOpen ? 'close' : 'menu' }}</mat-icon>
        </button>

        <!-- Mobile Navigation -->
        <nav class="mobile-nav" [class.open]="isMobileMenuOpen">
          <div class="mobile-nav-content">
            <div class="mobile-nav-header">
              <span class="mobile-nav-title">Menu</span>
              <button mat-icon-button class="mobile-close-btn" (click)="closeMobileMenu()" aria-label="Close menu">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <a href="#" class="mobile-nav-link" (click)="closeMobileMenu()">Home</a>
            <div class="mobile-nav-dropdown">
              <span class="mobile-nav-link" (click)="toggleServicesMenu()">
                Services
                <mat-icon class="dropdown-icon" [class.rotated]="isServicesMenuOpen">expand_more</mat-icon>
              </span>
              <div class="mobile-submenu" [class.open]="isServicesMenuOpen">
                <a href="#" class="mobile-submenu-link" (click)="closeMobileMenu()">Food</a>
                <a href="#" class="mobile-submenu-link" (click)="closeMobileMenu()">Job Search</a>
              </div>
            </div>
                          <a href="#" class="mobile-nav-link" (click)="closeMobileMenu()">About</a>
              @if (authService.isAuthenticated()) {
                <div class="mobile-user-section">
                  <div class="mobile-user-info">
                    <mat-icon>account_circle</mat-icon>
                    <span>{{ authService.currentUser()?.name }}</span>
                  </div>
                  <a routerLink="/profile" class="mobile-nav-link" (click)="closeMobileMenu()">Profile</a>
                  <a href="#" class="mobile-nav-link" (click)="closeMobileMenu()">Settings</a>
                  <button class="mobile-nav-link logout-btn" (click)="authService.signout(); closeMobileMenu()">
                    <mat-icon>logout</mat-icon>
                    Logout
                  </button>
                </div>
              } @else {
                <a routerLink="/auth/signin" class="mobile-nav-link login-btn" (click)="closeMobileMenu()">Login</a>
              }
          </div>
        </nav>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  isMobileMenuOpen = false;
  isServicesMenuOpen = false;

  constructor(public authService: AuthService) {}

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (!this.isMobileMenuOpen) {
      this.isServicesMenuOpen = false;
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.isServicesMenuOpen = false;
  }

  toggleServicesMenu() {
    this.isServicesMenuOpen = !this.isServicesMenuOpen;
  }
}
