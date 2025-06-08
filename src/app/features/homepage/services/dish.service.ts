import { Injectable, signal } from '@angular/core';

export interface Dish {
  id: number;
  name: string;
  image: string;
  description: string;
  price?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DishService {
  private dishesSignal = signal<Dish[]>([]);

  // Read-only signal for components to subscribe to
  readonly dishes = this.dishesSignal.asReadonly();

  async loadDishes(): Promise<Dish[]> {
    // Simulate API call
    const mockDishes: Dish[] = [
      {
        id: 1,
        name: 'Dal Makhani',
        image: '/assets/images/dal-makhani.jpg',
        description: 'Creamy black lentil curry',
        price: 250
      },
      {
        id: 2,
        name: 'Butter Chicken',
        image: '/assets/images/butter-chicken.jpg',
        description: 'Rich tomato-based chicken curry',
        price: 350
      },
      {
        id: 3,
        name: 'Palak Paneer',
        image: '/assets/images/palak-paneer.jpg',
        description: 'Spinach curry with cottage cheese',
        price: 280
      }
    ];

    this.dishesSignal.set(mockDishes);
    return mockDishes;
  }

  getDishById(id: number): Dish | undefined {
    return this.dishes().find(dish => dish.id === id);
  }
}
