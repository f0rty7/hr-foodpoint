import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishService } from '../../services/dish.service';
import { getCategoryColor } from '../../../../shared/utils/color-generator.util';

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

      <div class="dishes-list">
        @for (dish of dishService.dishes; track dish.id) {
          <div class="dish-card">
            <div class="card-header">
              <div class="dish-logo" [style.background-color]="getDishColor('food')">
                <span>{{ getDishInitial(dish.name) }}</span>
              </div>
              <h4 class="dish-title">{{ dish.name }}</h4>
            </div>

            <!-- <div class="dish-info">
              <div class="dish-category">Indian Cuisine</div>
              <div class="availability">Available</div>
            </div> -->
            <img class="dish-image" [src]="dish.image" [alt]="dish.name" loading="lazy" />

            <!-- <h4 class="dish-title">{{ dish.name }}</h4> -->

            <!-- <div class="dish-tags">
              <span class="tag">Popular</span>
            </div> -->

            <div class="card-footer">
              <div class="dish-details">
                @if (dish.price) {
                  <div class="price">₹{{ dish.price }}</div>
                }
                <!-- <div class="description">{{ dish.description }}</div> -->
              </div>
              <button [style.background-color]="getDishColor('food')" class="order-btn">View</button>
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

  getDishInitial(dishName: string): string {
    if (dishName) {
      return dishName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return '';
  }

  getDishColor(category: string): string {
    return getCategoryColor(category);
  }
}
