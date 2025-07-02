import { Component, input, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../services/food-listing.service';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="food-card" [class.out-of-stock]="menuItem().in_stock === 0 || menuItem().isInStock === false">
      <div class="card-image">
        <img
          [src]="menuItem().image_url || menuItem().images?.primary || 'assets/images/food-plate.webp'"
          [alt]="menuItem().name"
          loading="lazy"
          (error)="onImageError($event)"
        />
        @if (menuItem().recommended || menuItem().isRecommended) {
          <div class="recommended-badge">⭐ Recommended</div>
        }
        @if (menuItem().is_veg === 'VEG' || menuItem().isVeg === true) {
          <div class="veg-badge">🌱 Veg</div>
        }
        @if (menuItem().in_stock === 0 || menuItem().isInStock === false) {
          <div class="out-of-stock-overlay">
            <span>Out of Stock</span>
          </div>
        }
        @if (isAdmin()) {
          <div class="admin-controls">
            <button class="edit-btn" (click)="onEditClick()" title="Edit Item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        }
      </div>

      <div class="card-content">
        <h3 class="food-name">{{ menuItem().name }}</h3>
        <p class="food-description">{{ menuItem().description }}</p>

        <div class="price-section">
          <div class="price">₹{{ menuItem().price || menuItem().basePrice }}</div>
          @if ((menuItem().packing_charges || menuItem().packingCharges || 0) > 0) {
            <div class="packing-charges">+ ₹{{ menuItem().packing_charges || menuItem().packingCharges }} packing</div>
          }
        </div>

        <div class="card-actions">
          <button
            class="order-btn"
            [disabled]="menuItem().in_stock === 0 || menuItem().isInStock === false"
            (click)="onOrderClick()">
            {{ (menuItem().in_stock === 0 || menuItem().isInStock === false) ? 'Out of Stock' : 'Order Me' }}
          </button>

          <div class="quantity-controls" [class.hidden]="!showQuantityControls()">
            <button class="qty-btn" (click)="decreaseQuantity()">-</button>
            <span class="quantity">{{ quantity() }}</span>
            <button class="qty-btn" (click)="increaseQuantity()">+</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './food-card.component.scss'
})
export class FoodCardComponent {
  // Using Angular v20 input signals
  menuItem = input.required<MenuItem>();
  isAdmin = input<boolean>(false);

  // Output events
  editItem = output<MenuItem>();

  // Local component state
  quantity = signal(0);
  showQuantityControls = signal(false);

  onOrderClick(): void {
    if (this.menuItem().in_stock === 0 || this.menuItem().isInStock === false) return;

    if (this.quantity() === 0) {
      this.increaseQuantity();
      this.showQuantityControls.set(true);
    }
  }

  onEditClick(): void {
    this.editItem.emit(this.menuItem());
  }

  increaseQuantity(): void {
    this.quantity.update(qty => qty + 1);
    this.showQuantityControls.set(true);
  }

  decreaseQuantity(): void {
    this.quantity.update(qty => {
      const newQty = Math.max(0, qty - 1);
      if (newQty === 0) {
        this.showQuantityControls.set(false);
      }
      return newQty;
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/food-plate.webp';
    img.classList.add('no-image')
  }
}
