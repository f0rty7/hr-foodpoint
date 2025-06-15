import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishService } from '../../services/dish.service';

@Component({
  selector: 'app-popular-dishes',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dishService.dishesLoading) {
      <div class="loading-message">Loading dishes...</div>
    }

    @if (dishService.dishesError) {
      <div class="error-message">Error: {{ dishService.dishesError }}</div>
    }

    <section class="popular-dishes">
      <div class="section-header">
        <h2 class="section-title">Popular Dishes</h2>
      </div>

      <div class="dishes-grid">
        @for (dish of dishService.dishes; track dish.id) {
          <div class="dish-card">
            <div class="dish-image" [style.background-image]="'url(' + dish.image + ')'">
            </div>
            <div class="dish-content">
              <h4 class="dish-name">{{ dish.name }}</h4>
              <p class="dish-description">{{ dish.description }}</p>
              <button class="order-btn" type="button">Order Now</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: './popular-dishes.component.scss'
})
export class PopularDishesComponent {
  constructor(public dishService: DishService) {}
}
