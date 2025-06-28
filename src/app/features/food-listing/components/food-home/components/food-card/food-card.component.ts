import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodItem } from '../../../../services/food.service';

@Component({
  selector: 'app-food-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="food-card">
      <div class="food-image">
        <img [src]="food.image" [alt]="food.name">
        @if (discountPercentage > 0) {
          <span class="discount-badge">-{{ discountPercentage }}%</span>
        }
      </div>

      <div class="food-info">
        <h3 class="food-name">{{ food.name }}</h3>
        <div class="price-info">
          <span class="current-price">$ {{ food.price.toFixed(2) }}</span>
          @if (food.originalPrice > food.price) {
            <span class="original-price">$ {{ food.originalPrice.toFixed(2) }}</span>
          }
        </div>
      </div>

      <div class="quantity-controls">
        @if (!food.quantity) {
          <button
            class="add-btn"
            (click)="updateQuantity.emit({ id: food.id, quantity: 1 })"
          >
            Add to Cart
          </button>
        } @else {
          <div class="quantity-buttons">
            <button
              class="quantity-btn"
              (click)="updateQuantity.emit({ id: food.id, quantity: food.quantity - 1 })"
            >
              -
            </button>
            <span class="quantity">{{ food.quantity }}</span>
            <button
              class="quantity-btn"
              (click)="updateQuantity.emit({ id: food.id, quantity: food.quantity + 1 })"
            >
              +
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .food-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      transition: all 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .food-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .food-image {
      position: relative;
      width: 100%;
      padding-top: 75%;
      background: #fff6f2;
    }

    .food-image img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 1rem;
    }

    .discount-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #ff5722;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 25px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .food-info {
      padding: 1rem;
    }

    .food-name {
      margin: 0 0 0.5rem;
      font-size: 1rem;
      color: #2c3e50;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .price-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .current-price {
      font-weight: 600;
      color: #2c3e50;
    }

    .original-price {
      color: #999;
      text-decoration: line-through;
      font-size: 0.875rem;
    }

    .quantity-controls {
      padding: 0 1rem 1rem;
    }

    .add-btn {
      width: 100%;
      background: #ff5722;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 25px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .add-btn:hover {
      background: #f4511e;
    }

    .quantity-buttons {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .quantity-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: #ff5722;
      color: white;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.2s;
    }

    .quantity-btn:hover {
      background: #f4511e;
    }

    .quantity {
      font-weight: 500;
      color: #2c3e50;
    }
  `]
})
export class FoodCardComponent {
  @Input({ required: true }) food!: FoodItem;
  @Output() updateQuantity = new EventEmitter<{ id: string; quantity: number }>();

  get discountPercentage(): number {
    if (!this.food.originalPrice || this.food.originalPrice <= this.food.price) return 0;
    return Math.round(((this.food.originalPrice - this.food.price) / this.food.originalPrice) * 100);
  }
}
