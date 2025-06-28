import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodItem } from '../../../../services/food.service';

type DeliveryOption = 'Delivery' | 'Dine In' | 'Take Away';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule],
  template:`
    <div class="order-details">
      <div class="order-header">
        <div class="order-info">
          <h2>Order Details</h2>
          <span class="order-number">#36470</span>
        </div>
        <div class="delivery-options">
          @for (option of deliveryOptions; track option) {
            <button
              class="delivery-btn"
              [class.active]="option === selectedDeliveryOption()"
              (click)="selectDeliveryOption(option)"
            >
              {{ option }}
            </button>
          }
        </div>
      </div>

      <div class="order-items">
        @for (item of items; track item.id) {
          <div class="order-item">
            <img [src]="item.image" [alt]="item.name" class="item-image">
            <div class="item-info">
              <h3>{{ item.name }}</h3>
              <p class="item-price">₹ {{ item.price.toFixed(2) }}</p>
            </div>
            <div class="item-quantity">×{{ item.quantity }}</div>
          </div>
        }
      </div>

      <div class="order-summary">
        <div class="summary-row">
          <span>Items</span>
          <span>₹ {{ subtotal().toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span>Discounts</span>
          <span class="discount">-₹ {{ discount().toFixed(2) }}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span>₹ {{ total().toFixed(2) }}</span>
        </div>
      </div>

      <button class="checkout-btn">
        Checkout
      </button>
    </div>
  `,
  styles: [`
    .order-details {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      width: 100%;
      position: sticky;
      top: 69px;
      z-index: 1;
    }

    .order-header {
      margin-bottom: 1.5rem;
    }

    .order-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      font-size: 24px;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 24px 0;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 12px;
    }

    .order-info h2 {
      font-size: 1.25rem;
      color: #2c3e50;
      margin: 0;
    }

    .order-number {
      color: #666;
      font-size: 0.875rem;
    }

    .delivery-options {
      display: flex;
      gap: 0.5rem;
    }

    .delivery-btn {
      flex: 1;
      padding: 0.5rem;
      border: none;
      border-radius: 25px;
      background: #f8f9fa;
      color: #666;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .delivery-btn:hover {
      background: #fff6f2;
      color: #ed8936;
    }

    .delivery-btn.active {
      background: #ed8936;
      color: white;
    }

    .order-items {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
      max-height: 300px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .order-items::-webkit-scrollbar {
      width: 4px;
    }

    .order-items::-webkit-scrollbar-track {
      background: #f8f9fa;
      border-radius: 2px;
    }

    .order-items::-webkit-scrollbar-thumb {
      background: #ddd;
      border-radius: 2px;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .item-image {
      width: 50px;
      height: 50px;
      object-fit: contain;
      background: white;
      border-radius: 8px;
      padding: 0.25rem;
    }

    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-info h3 {
      margin: 0;
      font-size: 0.875rem;
      color: #2c3e50;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-price {
      margin: 0.25rem 0 0;
      color: #666;
      font-size: 0.875rem;
    }

    .item-quantity {
      color: #666;
      font-size: 0.875rem;
    }

    .order-summary {
      border-top: 1px solid #eee;
      padding-top: 1rem;
      margin-bottom: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .discount {
      color: #ed8936;
    }

    .total {
      color: #2c3e50;
      font-weight: 600;
      font-size: 1rem;
      margin-top: 0.5rem;
    }

    .checkout-btn {
      width: 100%;
      background: #ed8936;
      color: white;
      border: none;
      padding: 0.75rem;
      border-radius: 25px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .checkout-btn:hover {
      background: #f4511e;
    }

    @media (max-width: 992px) {
      .order-details {
        border-radius: 0;
        padding: 1rem;
        box-shadow: none;
      }

      .order-items {
        max-height: 200px;
      }
    }
  `]
})
export class OrderDetailsComponent {
  @Input({ required: true }) items: FoodItem[] = [];

  deliveryOptions: DeliveryOption[] = ['Dine In', 'Take Away'];
  selectedDeliveryOption = signal<DeliveryOption>('Delivery');

  subtotal = computed(() =>
    this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  discount = computed(() =>
    this.items.reduce((sum, item) => {
      if (!item.originalPrice) return sum;
      return sum + ((item.originalPrice - item.price) * item.quantity);
    }, 0)
  );

  total = computed(() => this.subtotal() - this.discount());

  selectDeliveryOption(option: DeliveryOption) {
    this.selectedDeliveryOption.set(option);
  }
}
