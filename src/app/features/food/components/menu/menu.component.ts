import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FoodListingService, MenuItem } from '../../services/food-listing.service';
import { FoodService } from '../../services/food.service';
import { FoodCardComponent } from '../food-card/food-card.component';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';
import { OrderDetailsComponent } from '../order-details/order-details.component';
import { AddItemFormComponent } from '../add-item-form/add-item-form.component';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface Category {
  id: string;
  name: string;
  subcategories?: Array<{
    id: string;
    name: string;
  }>;
}

@Component({
  selector: 'app-food-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FoodCardComponent,
    FilterSidebarComponent,
    OrderDetailsComponent,
    AddItemFormComponent
  ],
  template: `
    <div class="food-listing-container">
      <!-- Filter Sidebar -->
      <aside class="filter-sidebar">
        <app-filter-sidebar />
      </aside>

      <!-- Main Content -->
      <main class="main-content">

      <div class="user-cta">
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

        <!-- Top Categories -->
        <section class="top-categories">
          <!-- <h2 class="section-title">Categories</h2> -->
          <!-- <div class="categories-text"> -->
            <!-- Results Info -->
            <!-- @if (!foodService.isLoading && !foodService.hasError) {
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
            } -->
          <!-- </div> -->

          <div class="categories-pills">
            @if(authService.isAdmin()) {
                <button class="category-pill-add">
                  Add Category
                </button>
              }

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

        <!-- Food Grid -->
        @if (!foodService.isLoading && !foodService.hasError) {
          <div class="food-grid">
            @if(authService.isAdmin() && foodService.selectedCategory()) {
              <div class="add-food-button">
                <button (click)="openAddItemForm()" [disabled]="isAddingItem()">
                  {{ isAddingItem() ? 'Adding...' : 'Add Item' }}
                </button>
              </div>
            }
            @for (item of foodService.filteredItems(); track item.id || item._id) {
              <app-food-card [menuItem]="item" [isAdmin]="authService.isAdmin()" (editItem)="onEditItem($event)" />
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

      <aside class="filter-sidebar">
        <app-order-details [items]="cartService.cart()" />
      </aside>
    </div>

    <!-- Add Item Form Modal -->
    @if (showAddItemForm()) {
      <app-add-item-form
        [isVisible]="true"
        [categories]="foodService.categories()"
        [selectedCategoryId]="foodService.selectedCategory() || null"
        [editItem]="editingItem()"
        (itemCreated)="onItemCreated()"
        (itemUpdated)="onItemUpdated()"
        (cancelled)="closeAddItemForm()">
      </app-add-item-form>
    }
  `,
  styleUrl: './menu.component.scss'
})

export class MenuListingComponent {
  readonly foodService = inject(FoodListingService);
  readonly cartService = inject(FoodService);
  readonly authService = inject(AuthService);

  constructor() {
    console.log(this.authService.currentUser())
    // this.isAdmin.set(this.authService.isAdmin())
  }

  // Local component signals
  showSortDropdown = signal(false);
  showFilterDropdown = signal(false);
  showAddItemForm = signal(false);
  isAddingItem = signal(false);
  editingItem = signal<MenuItem | null>(null);

  // Computed values for selected category
  selectedCategoryId = computed(() => this.foodService.selectedCategory() || '');
  selectedCategoryName = computed(() => {
    const categoryId = this.foodService.selectedCategory();
    if (!categoryId) return '';
    const category = this.foodService.categories().find(c => c.id === categoryId);
    return category?.name || '';
  });

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

  // Add Item functionality
  openAddItemForm(): void {
    this.editingItem.set(null);
    this.showAddItemForm.set(true);
  }

  closeAddItemForm(): void {
    this.showAddItemForm.set(false);
    this.editingItem.set(null);
    this.isAddingItem.set(false);
  }

  async onItemCreated(): Promise<void> {
    this.closeAddItemForm();
    await this.foodService.refreshMenu();
  }

  async onItemUpdated(): Promise<void> {
    this.closeAddItemForm();
    await this.foodService.refreshMenu();
  }

  onEditItem(item: MenuItem): void {
    this.editingItem.set(item);
    this.showAddItemForm.set(true);
  }

  onCategorySelected(categoryId: string | null): void {
    this.foodService.updateSelectedCategory(categoryId || undefined);
  }

  onFilterChanged(filters: any): void {
    // Handle filter changes - for now just log them since the specific updateFilters method doesn't exist
    console.log('Filters changed:', filters);
  }
}
