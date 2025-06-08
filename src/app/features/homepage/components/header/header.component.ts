import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="logo">
          LOGO
        </div>
        <nav class="navigation">
          <a href="#" class="nav-link">Home</a>
          <a href="#" class="nav-link">Food</a>
          <a href="#" class="nav-link">Jobs</a>
          <a href="#" class="nav-link">About</a>
        </nav>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {}
