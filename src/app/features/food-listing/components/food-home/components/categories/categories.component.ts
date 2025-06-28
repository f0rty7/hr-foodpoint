import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Category {
  id: string;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-food-categories',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="categories">
      <div class="categories-list">
        @for (category of categories(); track category.id) {
          <button
            class="category-btn"
            [class.active]="category.id === activeCategory()"
            (click)="setActiveCategory(category.id)"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .categories {
      margin: 1rem 0;
    }

    .categories-list {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      padding: 0.5rem;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .categories-list::-webkit-scrollbar {
      display: none;
    }

    .category-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      border: none;
      border-radius: 25px;
      background: white;
      color: #666;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .category-btn:hover {
      background: #fff6f2;
      color: #ff5722;
    }

    .category-btn.active {
      background: #ff5722;
      color: white;
    }

    .category-icon {
      font-size: 1.25rem;
    }

    .category-name {
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .categories {
        margin: 0.5rem 0;
      }

      .category-btn {
        padding: 0.5rem 1rem;
      }
    }
  `]
})
export class FoodCategoriesComponent {
  categories = signal<Category[]>([
    { id: 'all', name: 'All', icon: '🍽️' },
    { id: 'burrito', name: 'Burrito', icon: '🌯' },
    { id: 'fries', name: 'Fries', icon: '🍟' },
    { id: 'hotdog', name: 'Hot Dog', icon: '🌭' },
    { id: 'sushi', name: 'Sushi', icon: '🍱' },
    { id: 'pizza', name: 'Pizza', icon: '🍕' },
    { id: 'burger', name: 'Burger', icon: '🍔' },
    { id: 'dessert', name: 'Dessert', icon: '🍰' }
  ]);

  activeCategory = signal('all');

  setActiveCategory(id: string) {
    this.activeCategory.set(id);
  }
}
