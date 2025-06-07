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
            Welcome to HR FoodPoint, where culinary excellence meets modern convenience. Born from a passion for delivering exceptional dining experiences, we started as a small cloud kitchen with a big dream - to bring restaurant-quality meals directly to your doorstep.

            Our journey began when our founder, a seasoned chef with over 15 years of experience in fine dining, recognized the changing landscape of food service. We embraced the cloud kitchen model to focus entirely on what matters most: crafting delicious, fresh meals using premium ingredients and time-honored recipes.

            From our state-of-the-art kitchen facility, we prepare each dish with meticulous attention to detail, ensuring every order meets our high standards of quality and taste. We believe that great food should be accessible to everyone, which is why we've streamlined our operations to offer exceptional value without compromising on quality.
          </p>
        </div>
      </div>
    </section>
  `,
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent {}
