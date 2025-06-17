import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodListingService } from '../../services/food-listing.service';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-sidebar-content">
      <h3 class="filter-title">Filters</h3>

      <!-- Price Range -->
      <div class="filter-section">
        <h4 class="filter-section-title">Price Range</h4>
        <div class="price-inputs">
          <input
            type="number"
            class="price-input"
            placeholder="Min"
            [value]="minPrice()"
            (input)="onMinPriceChange($event)"
          />
          <span class="price-separator">-</span>
          <input
            type="number"
            class="price-input"
            placeholder="Max"
            [value]="maxPrice()"
            (input)="onMaxPriceChange($event)"
          />
        </div>
        <div class="price-range-info">
          Range: ₹{{ foodService.menuStats().priceRange.min }} - ₹{{ foodService.menuStats().priceRange.max }}
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="filter-section">
        <h4 class="filter-section-title">Quick Filters</h4>
                 <label class="filter-option">
           <input
             type="checkbox"
             [checked]="foodService.vegOnly()"
             (change)="onVegOnlyChange($event)"
           />
           <span class="checkmark"></span>
           Vegetarian Only
         </label>
         <label class="filter-option">
           <input
             type="checkbox"
             [checked]="foodService.inStockOnly()"
             (change)="onInStockOnlyChange($event)"
           />
           <span class="checkmark"></span>
           In Stock Only
         </label>
      </div>

      <!-- Categories -->
      <div class="filter-section">
        <h4 class="filter-section-title">Categories</h4>
        <div class="category-list">
          <label class="category-option">
            <input
              type="radio"
              name="category"
              [checked]="!foodService.selectedCategory()"
              (change)="foodService.updateSelectedCategory(undefined)"
            />
            <span class="radio-mark"></span>
            All Categories
          </label>
          @for (category of foodService.categories(); track category.id) {
            <label class="category-option">
              <input
                type="radio"
                name="category"
                [checked]="foodService.selectedCategory() === category.id"
                (change)="foodService.updateSelectedCategory(category.id)"
              />
              <span class="radio-mark"></span>
              {{ category.name }}
            </label>
          }
        </div>
      </div>

      <!-- Statistics -->
      <div class="filter-section">
        <h4 class="filter-section-title">Statistics</h4>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ foodService.menuStats().totalItems }}</div>
            <div class="stat-label">Total Items</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ foodService.menuStats().categories }}</div>
            <div class="stat-label">Categories</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ foodService.menuStats().vegItems }}</div>
            <div class="stat-label">Veg Items</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">₹{{ foodService.menuStats().averagePrice | number:'1.0-0' }}</div>
            <div class="stat-label">Avg Price</div>
          </div>
        </div>
      </div>

      <!-- Clear Filters -->
      <div class="filter-actions">
        <button class="clear-filters-btn" (click)="clearAllFilters()">
          Clear All Filters
        </button>
      </div>
    </div>
  `,
  styleUrl: './filter-sidebar.component.scss'
})
export class FilterSidebarComponent {
  readonly foodService = inject(FoodListingService);

  // Local signals for price inputs
  minPrice = signal<number | undefined>(undefined);
  maxPrice = signal<number | undefined>(undefined);

  onMinPriceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value ? Number(target.value) : undefined;
    this.minPrice.set(value);
    this.updatePriceRange();
  }

  onMaxPriceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value ? Number(target.value) : undefined;
    this.maxPrice.set(value);
    this.updatePriceRange();
  }

  private updatePriceRange(): void {
    this.foodService.updatePriceRange(this.minPrice(), this.maxPrice());
  }

  clearAllFilters(): void {
    this.foodService.updateSearchQuery('');
    this.foodService.updateSelectedCategory(undefined);
    this.foodService.updateVegOnly(false);
    this.foodService.updateInStockOnly(false);
    this.foodService.updatePriceRange();
    this.minPrice.set(undefined);
    this.maxPrice.set(undefined);
  }

  onVegOnlyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.foodService.updateVegOnly(target.checked);
  }

  onInStockOnlyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.foodService.updateInStockOnly(target.checked);
  }
}
