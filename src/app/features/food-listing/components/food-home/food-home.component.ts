import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-food-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="food-home-container">
      <header class="welcome-header">
        <h1>Welcome, {{ authService.currentUser()?.name || 'Guest' }}!</h1>
        <p class="subtitle">Explore our delicious menu</p>
      </header>

      <div class="quick-actions">
        <div class="action-card" routerLink="/food/list">
          <span class="icon">🍽️</span>
          <h3>Browse Menu</h3>
          <p>Explore our full menu selection</p>
        </div>

        <div class="action-card" routerLink="/food/list">
          <span class="icon">⭐</span>
          <h3>Popular Items</h3>
          <p>See what others are loving</p>
        </div>

        <div class="action-card" routerLink="/food/list">
          <span class="icon">🔥</span>
          <h3>Today's Specials</h3>
          <p>Check out our daily deals</p>
        </div>

        <div class="action-card" routerLink="/food/list">
          <span class="icon">🕒</span>
          <h3>Recent Orders</h3>
          <p>Quick reorder from history</p>
        </div>
      </div>

      <section class="featured-section">
        <h2>Featured Items</h2>
        <div class="featured-items">
          <!-- Add featured items here -->
          <div class="featured-item">
            <div class="item-image">🍕</div>
            <h3>Margherita Pizza</h3>
            <p>Fresh basil, tomato sauce, and mozzarella</p>
            <button class="order-button">Order Now</button>
          </div>
          <div class="featured-item">
            <div class="item-image">🍔</div>
            <h3>Classic Burger</h3>
            <p>100% Angus beef with fresh toppings</p>
            <button class="order-button">Order Now</button>
          </div>
          <div class="featured-item">
            <div class="item-image">🥗</div>
            <h3>Garden Salad</h3>
            <p>Fresh mixed greens with house dressing</p>
            <button class="order-button">Order Now</button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .food-home-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .welcome-header h1 {
      font-size: 2.5rem;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #7f8c8d;
      font-size: 1.2rem;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .action-card {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      text-align: center;
    }

    .action-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      display: block;
    }

    .action-card h3 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .action-card p {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .featured-section {
      margin-top: 3rem;
    }

    .featured-section h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 2rem;
    }

    .featured-items {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .featured-item {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .item-image {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .featured-item h3 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .featured-item p {
      color: #7f8c8d;
      margin-bottom: 1rem;
    }

    .order-button {
      background: #e74c3c;
      color: white;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .order-button:hover {
      background: #c0392b;
    }
  `]
})
export class FoodHomeComponent {
  authService = inject(AuthService);
}
