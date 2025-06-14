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
        <button class="cta-button" type="button" (click)="openLink()">Get Started</button>
      </div>
    </section>
  `,
  styleUrl: './hero-section.component.scss'
})

export class HeroSectionComponent {

  openLink() {
    // window.open('https://www.swiggy.com/city/bangalore/hr-food-point-mahalingeshwara-layout-adugodi-rest1059367', '_blank') //swiggy
    window.open('https://www.zomato.com/bangalore/hr-food-point-btm-bangalore/order', '_blank') //zomato
  }
}
