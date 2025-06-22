import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from '../../services/food-listing.service';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="food-card" [class.out-of-stock]="menuItem().in_stock === 0">
      <div class="card-image">
        <img
          [src]="menuItem().image_url"
          [alt]="menuItem().name"
          loading="lazy"
          (error)="onImageError($event)"
        />
        @if (menuItem().recommended) {
          <div class="recommended-badge">⭐ Recommended</div>
        }
        @if (menuItem().is_veg === 'Yes') {
          <div class="veg-badge">🌱 Veg</div>
        }
        @if (menuItem().in_stock === 0) {
          <div class="out-of-stock-overlay">
            <span>Out of Stock</span>
          </div>
        }
      </div>

      <div class="card-content">
        <h3 class="food-name">{{ menuItem().name }}</h3>
        <p class="food-description">{{ menuItem().description }}</p>

        <div class="price-section">
          <div class="price">₹{{ menuItem().price }}</div>
          @if (menuItem().packing_charges > 0) {
            <div class="packing-charges">+ ₹{{ menuItem().packing_charges }} packing</div>
          }
        </div>

        <div class="card-actions">
          <button
            class="order-btn"
            [disabled]="menuItem().in_stock === 0"
            (click)="onOrderClick()">
            {{ menuItem().in_stock === 0 ? 'Out of Stock' : 'Order Me' }}
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

  // Local component state
  quantity = signal(0);
  showQuantityControls = signal(false);

  onOrderClick(): void {
    if (this.menuItem().in_stock === 0) return;

    if (this.quantity() === 0) {
      this.increaseQuantity();
      this.showQuantityControls.set(true);
    }
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
    img.src = 'https://media.istockphoto.com/id/1038356020/vector/restaurant-icon.jpg?s=612x612&w=0&k=20&c=Tk_v3JuJA4lz_8ZRJi78xS4p75Idqt97uEtYJciVtFI=';
    img.classList.add('no-image')
  }
}
