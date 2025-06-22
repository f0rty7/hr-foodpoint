import { Injectable, signal, resource, computed, effect } from '@angular/core';
import { environment } from '../../../../environments/environment';

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
  private readonly API_BASE_URL = environment.apiUrl + 'homepage'; // Use environment variable

  // Signal to trigger resource refresh
  private refreshTrigger = signal(0);

  // Search filter signal (Angular v20 feature)
  searchQuery = signal('');

  // Computed signal for filtered dishes (Angular v20 stable computed)
  filteredDishes = computed(() => {
    const dishes = this.dishesResource.value() || [];
    const query = this.searchQuery().toLowerCase();

    if (!query) return dishes;

    return dishes.filter(dish =>
      dish.name.toLowerCase().includes(query) ||
      dish.description.toLowerCase().includes(query)
    );
  });

  // Computed signal for dish statistics (Angular v20 stable feature)
  dishStats = computed(() => {
    const dishes = this.dishesResource.value() || [];
    return {
      total: dishes.length,
      averagePrice: dishes.reduce((sum, dish) => sum + (dish.price || 0), 0) / dishes.length || 0,
      priceRange: {
        min: Math.min(...dishes.map(d => d.price || 0)),
        max: Math.max(...dishes.map(d => d.price || 0))
      }
    };
  });

  constructor() {
    // Angular v20 stable effect API for side effects
    effect(() => {
      const stats = this.dishStats();
      if (environment.enableLogging) {
        console.log('📊 Dish Statistics Updated:', stats);
      }

      // Could trigger analytics, local storage updates, etc.
      this.persistSearchPreferences();
    });

    effect(() => {
      const query = this.searchQuery();
      if (query && environment.enableLogging) {
        console.log('🔍 Search Query Changed:', query);
      }
    });
  }

  private persistSearchPreferences(): void {
    // Example: Store search preferences in localStorage
    const preferences = {
      lastSearch: this.searchQuery(),
      lastUpdated: Date.now()
    };
    localStorage.setItem('dish-preferences', JSON.stringify(preferences));
  }

  // Resource for fetching all dishes
  readonly dishesResource = resource({
    loader: async ({ abortSignal }) => {
      try {
        const response = await fetch(`${this.API_BASE_URL}/dishes`, {
          signal: abortSignal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Log in development environment
        if (environment.enableLogging) {
          console.log('Fetched dishes:', data);
        }

        // Extract dishes array from the response object
        return data.dishes as Dish[];
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error; // Re-throw abort errors
        }

        if (environment.enableLogging) {
          console.warn('Failed to fetch dishes from API, using fallback data:', error);
        }
        // Fallback to mock data if API fails
        return this.getMockDishes();
      }
    }
  });

  // Resource for fetching a single dish by ID
  private dishIdSignal = signal<number | undefined>(undefined);

  readonly dishByIdResource = resource({
    params: () => {
      const id = this.dishIdSignal();
      return id ? { id } : undefined;
    },
    loader: async ({ params, abortSignal }) => {
      if (!params?.id) return null;

      try {
        const response = await fetch(`${this.API_BASE_URL}/dishes/${params.id}`, {
          signal: abortSignal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json() as Dish;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        if (environment.enableLogging) {
          console.warn('Failed to fetch dish from API:', error);
        }
        // Fallback to finding in current dishes
        const dishes = this.dishesResource.value();
        return dishes?.find((dish: Dish) => dish.id === params.id) || null;
      }
    }
  });

  // Computed getters for easy access
  get dishes(): Dish[] {
    return this.dishesResource.value() || [];
  }

  get dishesLoading(): boolean {
    return this.dishesResource.isLoading();
  }

  get dishesError(): any {
    return this.dishesResource.error();
  }

  get dishesStatus(): any {
    return this.dishesResource.status();
  }

  // Methods
  getDishById(id: number): Dish | null {
    this.dishIdSignal.set(id);
    return this.dishByIdResource.value() || null;
  }

  refreshDishes(): void {
    this.dishesResource.reload();
  }

  // Trigger a complete refresh by updating the refresh signal
  forceRefresh(): void {
    this.refreshTrigger.update(value => value + 1);
    this.dishesResource.reload();
  }

  private getMockDishes(): Dish[] {
    return [
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
  }

  // Utility method to find dish from current resource state
  findDishById(id: number): Dish | undefined {
    return this.dishes.find((dish: Dish) => dish.id === id);
  }
}
