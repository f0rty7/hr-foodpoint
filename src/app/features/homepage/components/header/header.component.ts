import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="logo">
          LOGO
        </div>
        <nav class="navigation">
          <a href="#" class="nav-link">Home</a>
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
          <a href="#" class="nav-link login-btn">Login</a>
        </nav>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {}
