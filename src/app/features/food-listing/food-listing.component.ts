import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FoodListingService } from './services/food-listing.service';
import { FoodCardComponent } from './components/food-card/food-card.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { HeaderComponent } from '../homepage/components/header/header.component';

@Component({
  selector: 'app-food-listing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FoodCardComponent,
    FilterSidebarComponent,
    HeroSectionComponent,
    HeaderComponent
  ],
  template: `
  <app-header />
    <!-- Hero Section -->
    <app-hero-section />

    <div class="food-listing-container">
      <!-- Filter Sidebar -->
      <aside class="filter-sidebar">
        <app-filter-sidebar />
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Categories -->
        <section class="top-categories">
          <h2 class="section-title">Top Categories</h2>
          <div class="categories-text">This is the top picked foods for you</div>

          <div class="categories-pills">
            <button
              class="category-pill"
              [class.active]="!foodService.selectedCategory()"
              (click)="foodService.updateSelectedCategory(undefined)">
              All
            </button>
            @for (category of foodService.categories(); track category.id) {
              <button
                class="category-pill {{ category.id }}"
                [class.active]="foodService.selectedCategory() === category.id"
                (click)="foodService.updateSelectedCategory(category.id); logCategory(category)">
                {{ category.name }}
              </button>
            }
          </div>
        </section>

        <!-- Controls Bar -->
        <div class="controls-bar">
          <div class="search-section">
            <input
              type="text"
              class="search-input"
              placeholder="Search dishes..."
              [value]="foodService.searchQuery()"
              (input)="onSearchInput($event)"
            />
          </div>

          <div class="controls-right">
            <button class="control-btn" (click)="toggleSortDropdown()">
              <span class="icon">⇅</span>
              Sort
            </button>
            <button class="control-btn" (click)="toggleFilterDropdown()">
              <span class="icon">⚙</span>
              Filter
            </button>
          </div>

          <!-- Sort Dropdown -->
          @if (showSortDropdown()) {
            <div class="dropdown sort-dropdown">
              <button
                class="dropdown-item"
                [class.active]="foodService.sortBy() === 'popularity'"
                (click)="updateSort('popularity')">
                Popularity
              </button>
              <button
                class="dropdown-item"
                [class.active]="foodService.sortBy() === 'price'"
                (click)="updateSort('price')">
                Price
              </button>
              <button
                class="dropdown-item"
                [class.active]="foodService.sortBy() === 'name'"
                (click)="updateSort('name')">
                Name
              </button>
            </div>
          }

                    <!-- Filter Dropdown -->
          @if (showFilterDropdown()) {
            <div class="dropdown filter-dropdown">
              <label class="dropdown-item">
                <input
                  type="checkbox"
                  [checked]="foodService.vegOnly()"
                  (change)="onVegOnlyChange($event)"
                />
                Vegetarian Only
              </label>
              <label class="dropdown-item">
                <input
                  type="checkbox"
                  [checked]="foodService.inStockOnly()"
                  (change)="onInStockOnlyChange($event)"
                />
                In Stock Only
              </label>
            </div>
          }
        </div>

        <!-- Loading State -->
        @if (foodService.isLoading) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading delicious meals...</p>
          </div>
        }

        <!-- Error State -->
        @if (foodService.hasError) {
          <div class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>We couldn't load the menu. Please try again.</p>
            <button class="retry-btn" (click)="foodService.refreshMenu()">
              Retry
            </button>
          </div>
        }

        <!-- Results Info -->
        @if (!foodService.isLoading && !foodService.hasError) {
          <div class="results-info">
            <span class="results-count">
              {{ foodService.filteredItems().length }} of {{ foodService.menuStats().totalItems }} dishes
            </span>
            @if (foodService.searchQuery()) {
              <span class="search-info">
                for "{{ foodService.searchQuery() }}"
              </span>
            }
          </div>
        }

        <!-- Food Grid -->
        @if (!foodService.isLoading && !foodService.hasError) {
          <div class="food-grid">
            @for (item of foodService.filteredItems(); track item.item.id) {
              <app-food-card [menuItem]="item.item" />
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">🍽️</div>
                <h3>No dishes found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button
                  class="clear-filters-btn"
                  (click)="clearAllFilters()">
                  Clear All Filters
                </button>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
  styleUrl: './food-listing.component.scss'
})
export class FoodListingComponent {
  readonly foodService = inject(FoodListingService);

  // Local component signals
  showSortDropdown = signal(false);
  showFilterDropdown = signal(false);

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.foodService.updateSearchQuery(target.value);
  }

  toggleSortDropdown(): void {
    this.showSortDropdown.update(show => !show);
    this.showFilterDropdown.set(false);
  }

  toggleFilterDropdown(): void {
    this.showFilterDropdown.update(show => !show);
    this.showSortDropdown.set(false);
  }

  updateSort(sortBy: 'name' | 'price' | 'popularity'): void {
    const currentOrder = this.foodService.sortOrder();
    const newOrder = this.foodService.sortBy() === sortBy && currentOrder === 'asc' ? 'desc' : 'asc';
    this.foodService.updateSorting(sortBy, newOrder);
    this.showSortDropdown.set(false);
  }

  clearAllFilters(): void {
    this.foodService.updateSearchQuery('');
    this.foodService.updateSelectedCategory(undefined);
    this.foodService.updateVegOnly(false);
    this.foodService.updateInStockOnly(false);
    this.foodService.updatePriceRange();
  }

  onVegOnlyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.foodService.updateVegOnly(target.checked);
  }

  onInStockOnlyChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.foodService.updateInStockOnly(target.checked);
  }

  logCategory(category: any): void {
    console.log("🚀 ~ logCategory ~ category:", category)
  }
}
