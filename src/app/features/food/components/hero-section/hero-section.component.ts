import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            Healthy, Affordable , Homelike Foods<br>
            Quickly to Your Door
          </h1>
          <p class="hero-subtitle">Ready to Enjoy in No Time!</p>
          <a class="cta-button" routerLink="/food/list">Order Now</a>
        </div>

        <div class="hero-images">
          <div class="image-grid">
            <div class="main-image">
              <img src="/assets/images/food-hero-main-transparent.webp" alt="Delicious burger" />
            </div>
            <!-- <div class="side-images">
              <div class="side-image">
                <img src="https://picsum.photos/200/150?random=pizza" alt="Pizza" loading="lazy" />
              </div>
              <div class="side-image">
                <img src="https://picsum.photos/200/150?random=pasta" alt="Pasta" loading="lazy" />
              </div>
              <div class="side-image">
                <img src="https://picsum.photos/200/150?random=salad" alt="Salad" loading="lazy" />
              </div>
              <div class="side-image">
                <img src="https://picsum.photos/200/150?random=biryani" alt="Biryani" loading="lazy" />
              </div>
            </div> -->
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent {}
