import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Home Like Food & Job Seeking</h1>
        <p class="hero-subtitle">Find meals and job opportunities in one place.</p>
        <button class="cta-button" type="button">Get Started</button>
      </div>
    </section>
  `,
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent {}
