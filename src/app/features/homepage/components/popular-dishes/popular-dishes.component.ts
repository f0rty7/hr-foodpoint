import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DishService } from '../../services/dish.service';

interface Dish {
  id: number;
  name: string;
  image: string;
  description: string;
}

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
        <!-- <button
          class="refresh-btn"
          (click)="dishService.refreshDishes()"
          [disabled]="dishService.dishesLoading"
          title="Refresh dishes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
          <span>Refresh</span>
        </button> -->
      </div>
      <div class="dishes-grid">
        @for (dish of dishService.dishes; track dish.id) {
          <div class="dish-card">
            <div class="dish-image" [style.background-image]="'url(' + dish.image + ')'">
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
