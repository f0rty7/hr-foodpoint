import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodService } from '../../../../services/food.service';

@Component({
  selector: 'app-food-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="search-container">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search your food"
            class="search-input"
          >
        </div>
      </div>

      <div class="actions">
        <button class="action-btn">
          <span class="icon">🛒</span>
          <span class="badge">{{ cartCount() }}</span>
        </button>
        <button class="action-btn">
          <span class="icon">🔔</span>
          <span class="badge">2</span>
        </button>
        <button class="menu-btn">
          <span class="dots">⋮</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: white;
      border-bottom: 1px solid #eee;
    }

    .search-container {
      flex: 1;
      max-width: 500px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #f8f9fa;
      border-radius: 25px;
      padding: 0.75rem 1.25rem;
    }

    .search-icon {
      color: #666;
      font-size: 1.25rem;
    }

    .search-input {
      flex: 1;
      border: none;
      background: none;
      outline: none;
      font-size: 0.875rem;
      color: #2c3e50;
      width: 100%;
    }

    .search-input::placeholder {
      color: #999;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .action-btn {
      position: relative;
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #666;
    }

    .icon {
      font-size: 1.25rem;
    }

    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #ff5722;
      color: white;
      font-size: 0.75rem;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: #666;
    }

    .dots {
      font-size: 1.5rem;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .header {
        padding: 1rem;
      }

      .search-container {
        max-width: none;
      }
    }
  `]
})
export class FoodHeaderComponent {
  private foodService = inject(FoodService);
  cartCount = this.foodService.cartCount;
}
