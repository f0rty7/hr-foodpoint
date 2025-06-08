import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="about-us">
      <h2 class="section-title">About us</h2>
      <div class="about-content">
        <div class="about-image">
          <img
            src="https://plus.unsplash.com/premium_photo-1723823036427-b19e6d270bb6?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="Professional kitchen"
            class="kitchen-image"
          />
        </div>
        <div class="about-text">
          <p>
            Welcome to HR FoodPoint, where culinary excellence meets modern convenience. We're a cloud kitchen dedicated to bringing restaurant-quality meals directly to your doorstep.

            Founded by a seasoned chef with over 15 years of fine dining experience, we focus on crafting delicious, fresh meals using premium ingredients and time-honored recipes. From our state-of-the-art kitchen facility, we prepare each dish with meticulous attention to detail, ensuring exceptional quality and taste at great value.
          </p>
        </div>
      </div>
    </section>
  `,
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent {}
