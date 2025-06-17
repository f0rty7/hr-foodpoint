import { Injectable, inject, signal, resource, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface MenuItem {
  id: string;
  uniqueId: string;
  name: string;
  description: string;
  category_id: string;
  is_veg: string;
  price: number;
  packing_charges: number;
  image_url: string;
  in_stock: number;
  enabled: number;
  variants: any;
  addons: any;
  recommended: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  items_order: Array<{ id: string; name: string; }>;
}

export interface MainCategory {
  id: string;
  name: string;
  main_category_order: number;
  sub_categories_order: SubCategory[];
}

export interface ItemVO {
  main_category_id: string;
  main_category_name: string;
  main_category_order: number;
  sub_category_id: string;
  sub_category_name: string;
  sub_category_order: number;
  item: MenuItem;
  item_slot: any;
  item_holiday_slots: any;
  variant_groups_vo: any[];
}

export interface MenuResponse {
  categories: MainCategory[];
  total_items: number;
  total_categories: number;
  out_of_stock_categories: string[];
  out_of_stock_sub_categories: string[];
  all_items: ItemVO[];
}

export interface SearchFilters {
  category?: string;
  veg_only?: boolean;
  max_price?: number;
  min_price?: number;
  in_stock_only?: boolean;
  query?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FoodListingService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE_URL = environment.apiUrl; // Use the base API URL

  // Signals for reactive state management (Angular v20 features)
  searchQuery = signal('');
  selectedCategory = signal<string | undefined>(undefined);
  priceRange = signal<{ min?: number; max?: number }>({});
  vegOnly = signal(false);
  inStockOnly = signal(true);
  sortBy = signal<'name' | 'price' | 'popularity'>('popularity');
  sortOrder = signal<'asc' | 'desc'>('asc');

      // Resource for fetching menu data (Angular v20 Resource API)
  readonly menuResource = resource({
    loader: async ({ abortSignal }) => {
      try {
        // Get authentication token from localStorage
        const token = localStorage.getItem('auth_token');

        if (!token) {
          throw new Error('Authentication token not found. Please login to access the menu.');
        }

        const response = await fetch(`${this.API_BASE_URL}menu`, {
          signal: abortSignal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          if (response.status === 404) {
            throw new Error('Menu API endpoint not found. Please check server configuration.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        console.log("🚀 ~ data:", data)


        if (environment.enableLogging) {
          console.log('🍽️ Menu data fetched successfully:', data);
        }

        return data as MenuResponse;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        console.error('Failed to fetch menu data:', error);

        // Fallback to mock data only in development
        if (!environment.production) {
          console.warn('Using mock data as fallback in development mode');
          return this.getMockMenuData();
        }

        throw error;
      }
    }
  });

  // Signal for detailed items fetched from API
  private detailedItems = signal<MenuItem[]>([]);

  // Computed signal for filtered and sorted items (now uses API data)
  readonly flattenedItems = computed(() => {
    return this.detailedItems();
  });

  // Computed signal for filtered and sorted items
  readonly filteredItems = computed(() => {
    const items = this.flattenedItems();
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();
    const vegOnly = this.vegOnly();
    const inStockOnly = this.inStockOnly();
    const priceRange = this.priceRange();
    const sortBy = this.sortBy();
    const sortOrder = this.sortOrder();

    let filtered = [...items];

    // Apply filters
    if (query) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    if (category) {
      filtered = filtered.filter(item => item.category_id === category);
    }

    if (vegOnly) {
      filtered = filtered.filter(item => item.is_veg === 'VEG');
    }

    if (inStockOnly) {
      filtered = filtered.filter(item => item.in_stock === 1);
    }

    if (priceRange.min !== undefined) {
      filtered = filtered.filter(item => item.price >= priceRange.min!);
    }

    if (priceRange.max !== undefined) {
      filtered = filtered.filter(item => item.price <= priceRange.max!);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'popularity':
          comparison = (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  });

  // Computed signal for categories
  readonly categories = computed(() => {
    const menu = this.menuResource.value();
    return menu?.categories || [];
  });

  // Computed signal for statistics
  readonly menuStats = computed(() => {
    const items = this.flattenedItems();
    const filtered = this.filteredItems();

    return {
      totalItems: items.length,
      filteredItems: filtered.length,
      categories: this.categories().length,
      averagePrice: items.reduce((sum, item) => sum + item.price, 0) / items.length || 0,
      priceRange: {
        min: Math.min(...items.map(item => item.price)),
        max: Math.max(...items.map(item => item.price))
      },
      vegItems: items.filter(item => item.is_veg === 'VEG').length,
      inStockItems: items.filter(item => item.in_stock === 1).length
    };
  });

  constructor() {
    // Effect to load all items when menu is available
    effect(() => {
      const menu = this.menuResource.value();

      console.log("🚀 ~ menu:", menu)

      if (menu?.all_items && this.detailedItems().length === 0) {
        // Extract MenuItem objects from all_items
        const items = menu.all_items.map(itemVO => itemVO.item);
        this.detailedItems.set(items);

        if (environment.enableLogging) {
          console.log('🍽️ Loaded detailed items from all_items:', items.length);
        }
      }
    });

    // Effect for logging search activity (Angular v20 effect API)
    effect(() => {
      const stats = this.menuStats();
      if (environment.enableLogging) {
        console.log('📊 Menu Statistics:', stats);
      }
    });

    effect(() => {
      const query = this.searchQuery();
      const category = this.selectedCategory();
      if ((query || category) && environment.enableLogging) {
        console.log('🔍 Filter Applied:', { query, category });
      }
    });
  }

  // Method to search menu with filters using the backend API
  async searchMenu(filters: SearchFilters): Promise<MenuItem[]> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const params = new URLSearchParams();
    if (filters.query) params.append('query', filters.query);
    if (filters.category) params.append('category', filters.category);
    if (filters.veg_only !== undefined) params.append('veg_only', filters.veg_only.toString());
    if (filters.max_price !== undefined) params.append('max_price', filters.max_price.toString());
    if (filters.min_price !== undefined) params.append('min_price', filters.min_price.toString());
    if (filters.in_stock_only !== undefined) params.append('in_stock_only', filters.in_stock_only.toString());

    const response = await fetch(`${this.API_BASE_URL}menu/search?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.items;
  }

  // Method to get detailed item information
  async getMenuItem(itemId: string): Promise<MenuItem> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.API_BASE_URL}menu/item/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get item: ${response.status}`);
    }

    const data = await response.json();
    return data.item;
  }

  // Method to get category items
  async getCategoryItems(categoryId: string): Promise<MenuItem[]> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.API_BASE_URL}menu/category/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get category items: ${response.status}`);
    }

    const data = await response.json();
    return data.items;
  }

  // Methods for updating filters
  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  updateSelectedCategory(categoryId: string | undefined): void {
    this.selectedCategory.set(categoryId);
  }

  updatePriceRange(min?: number, max?: number): void {
    this.priceRange.set({ min, max });
  }

  updateVegOnly(vegOnly: boolean): void {
    this.vegOnly.set(vegOnly);
  }

  updateInStockOnly(inStockOnly: boolean): void {
    this.inStockOnly.set(inStockOnly);
  }

  updateSorting(sortBy: 'name' | 'price' | 'popularity', order: 'asc' | 'desc' = 'asc'): void {
    this.sortBy.set(sortBy);
    this.sortOrder.set(order);
  }

  // Method to refresh menu data
  refreshMenu(): void {
    this.menuResource.reload();
    this.detailedItems.set([]); // Clear items to trigger reload
  }

  // Helper method to generate mock items from menu structure (fallback)
  private generateMockItems(menu: MenuResponse): MenuItem[] {
    const items: MenuItem[] = [];



    menu.categories.forEach((category: MainCategory) => {
      category.sub_categories_order.forEach((subCategory: SubCategory) => {
        subCategory.items_order.forEach((item: { id: string; name: string }) => {
          items.push({
            id: item.id,
            uniqueId: item.id,
            name: item.name,
            description: `Delicious ${item.name} from ${category.name}`,
            category_id: category.id,
            is_veg: Math.random() > 0.5 ? 'VEG' : 'NON_VEG',
            price: Math.floor(Math.random() * 500) + 100,
            packing_charges: 20,
            image_url: `https://picsum.photos/300/200?random=${item.id}`,
            in_stock: Math.random() > 0.1 ? 1 : 0,
            enabled: 1,
            variants: null,
            addons: null,
            recommended: Math.random() > 0.7
          });
        });
      });
    });

    console.log("🚀 ~ items:", items)
    return items;
  }

  // Getters for convenience
  get isLoading(): boolean {
    return this.menuResource.isLoading();
  }

  get error(): any {
    return this.menuResource.error();
  }

  get hasError(): boolean {
    return this.menuResource.status() === 'error';
  }

  // Mock data for development/fallback
  private getMockMenuData(): MenuResponse {
    const mockItems: ItemVO[] = [
      {
        main_category_id: "1",
        main_category_name: "American Cuisine",
        main_category_order: 1,
        sub_category_id: "11",
        sub_category_name: "Burgers",
        sub_category_order: 1,
        item: {
          id: "burger1",
          uniqueId: "burger1",
          name: "American Style Burger",
          description: "Delicious American style burger",
          category_id: "1",
          is_veg: "NON_VEG",
          price: 299,
          packing_charges: 20,
          image_url: "https://picsum.photos/300/200?random=burger1",
          in_stock: 1,
          enabled: 1,
          variants: null,
          addons: null,
          recommended: true
        },
        item_slot: null,
        item_holiday_slots: null,
        variant_groups_vo: []
      }
    ];

    return {
      categories: [
        {
          id: "1",
          name: "American Cuisine",
          main_category_order: 1,
          sub_categories_order: [
            {
              id: "11",
              name: "Burgers",
              items_order: [
                { id: "burger1", name: "American Style Burger" },
                { id: "burger2", name: "Cheese Burger" },
                { id: "burger3", name: "Chicken Burger" }
              ]
            },
            {
              id: "12",
              name: "Pizza",
              items_order: [
                { id: "pizza1", name: "Margherita Pizza" },
                { id: "pizza2", name: "Pepperoni Pizza" }
              ]
            }
          ]
        },
        {
          id: "2",
          name: "Asian Cuisine",
          main_category_order: 2,
          sub_categories_order: [
            {
              id: "21",
              name: "Chinese",
              items_order: [
                { id: "chinese1", name: "Fried Rice" },
                { id: "chinese2", name: "Noodles" }
              ]
            }
          ]
        },
        {
          id: "3",
          name: "European Cuisine",
          main_category_order: 3,
          sub_categories_order: [
            {
              id: "31",
              name: "Italian",
              items_order: [
                { id: "italian1", name: "Pasta" },
                { id: "italian2", name: "Risotto" }
              ]
            }
          ]
        }
      ],
      total_items: 7,
      total_categories: 3,
      out_of_stock_categories: [],
      out_of_stock_sub_categories: [],
      all_items: mockItems
    };
  }
}
