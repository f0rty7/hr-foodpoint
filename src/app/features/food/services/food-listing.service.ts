import { Injectable, signal, resource, computed, effect } from '@angular/core';
import { environment } from '../../../../environments/environment';

// New interfaces to match the MongoDB API structure
export interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  basePrice: number;
  packingCharges: number;
  isVeg: boolean;
  images: {
    primary: string;
    gallery?: string[];
  };
  isInStock: boolean;
  isActive: boolean;
  isRecommended: boolean;
  tags: string[];
  slug: string;
  // Legacy compatibility fields
  id?: string;
  uniqueId?: string;
  category_id?: string;
  is_veg?: string;
  price?: number;
  packing_charges?: number;
  image_url?: string;
  in_stock?: number;
  enabled?: number;
  variants?: any;
  addons?: any;
  recommended?: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  itemCount: number;
  subcategories: {
    id: string;
    name: string;
    displayOrder: number;
    itemCount: number;
  }[];
}

export interface MenuResponse {
  categories: MenuCategory[];
  totalItems: number;
  totalCategories: number;
  lastUpdated: Date;
}

export interface SearchMenuResponse {
  items: MenuItem[];
  totalResults: number;
  searchQuery: string;
  filtersApplied: {
    category?: string;
    vegOnly?: boolean;
    maxPrice?: number;
    minPrice?: number;
    inStockOnly?: boolean;
    tags?: string[];
  };
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
  private readonly API_BASE_URL = environment.apiUrl; // Use the base API URL

  // Signals for reactive state management (Angular v20 features)
  searchQuery = signal('');
  selectedCategory = signal<string | undefined>(undefined);
  priceRange = signal<{ min?: number; max?: number }>({});
  vegOnly = signal(false);
  inStockOnly = signal(true);
  sortBy = signal<'name' | 'price' | 'popularity'>('popularity');
  sortOrder = signal<'asc' | 'desc'>('asc');

  // Resource for fetching menu structure
  readonly menuResource = resource({
    loader: async ({ abortSignal }) => {
      try {
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
        console.log("🚀 ~ Menu structure data:", data);

        if (environment.enableLogging) {
          console.log('🍽️ Menu structure fetched successfully:', data);
        }

        return data as MenuResponse;
      } catch (error) {
        console.error('Failed to fetch menu structure:', error);

        if (!environment.production) {
          console.warn('Using mock data as fallback in development mode');
          return this.getMockMenuData();
        }

        throw error;
      }
    }
  });

  // Signal for detailed items fetched from search API
  private detailedItems = signal<MenuItem[]>([]);

  // Load all items using the search API (which returns all items when no filters)
  private loadAllItems = resource({
    loader: async ({ abortSignal }) => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${this.API_BASE_URL}menu/search?limit=1000`, {
          signal: abortSignal,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load items: ${response.status}`);
        }

        const data = await response.json() as SearchMenuResponse;
        console.log("🚀 ~ All items loaded:", data);

        // Transform items to legacy format for compatibility
        const transformedItems = data.items.map(item => this.transformToLegacyFormat(item));

        return transformedItems;
      } catch (error) {
        console.error('Failed to load all items:', error);

        if (!environment.production) {
          return this.generateMockItems();
        }

        throw error;
      }
    }
  });

  // Computed signal for items
  readonly flattenedItems = computed(() => {
    const items = this.loadAllItems.value();
    return items || [];
  });

  // Transform new format to legacy format for compatibility
  private transformToLegacyFormat(item: MenuItem): any {
    return {
      // Keep new format fields first
      ...item,
      // Then add/override with legacy format fields
      id: item._id || item.id,
      uniqueId: item._id || item.id,
      category_id: item.categoryId,
      is_veg: item.isVeg ? 'VEG' : 'NON_VEG',
      price: item.basePrice,
      packing_charges: item.packingCharges,
      image_url: item.images?.primary || '',
      in_stock: item.isInStock ? 1 : 0,
      enabled: item.isActive ? 1 : 0,
      variants: null,
      addons: null,
      recommended: item.isRecommended
    };
  }

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
      filtered = filtered.filter(item =>
        item.category_id === category || item.categoryId === category
      );
    }

    if (vegOnly) {
      filtered = filtered.filter(item =>
        item.is_veg === 'VEG' || item.isVeg === true
      );
    }

    if (inStockOnly) {
      filtered = filtered.filter(item =>
        item.in_stock === 1 || item.isInStock === true
      );
    }

    if (priceRange.min !== undefined) {
      filtered = filtered.filter(item =>
        (item.price || item.basePrice || 0) >= priceRange.min!
      );
    }

    if (priceRange.max !== undefined) {
      filtered = filtered.filter(item =>
        (item.price || item.basePrice || 0) <= priceRange.max!
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          const priceA = a.price || a.basePrice || 0;
          const priceB = b.price || b.basePrice || 0;
          comparison = priceA - priceB;
          break;
        case 'popularity':
          const recA = a.recommended || a.isRecommended ? 1 : 0;
          const recB = b.recommended || b.isRecommended ? 1 : 0;
          comparison = recB - recA;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  });

  // Computed signal for categories from the menu structure
  readonly categories = computed(() => {
    const menu = this.menuResource.value();
    return menu?.categories || [];
  });

    // Computed signal for menu statistics
  readonly menuStats = computed(() => {
    const items = this.filteredItems();
    const totalItems = items.length;
    const vegItems = items.filter(item =>
      item.is_veg === 'VEG' || item.isVeg === true
    ).length;
    const inStockItems = items.filter(item =>
      item.in_stock === 1 || item.isInStock === true
    ).length;
    const categories = this.categories().length;

    // Calculate price statistics
    const prices = items.map(item => item.price || item.basePrice || 0).filter(price => price > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      totalItems,
      vegItems,
      nonVegItems: totalItems - vegItems,
      inStockItems,
      outOfStockItems: totalItems - inStockItems,
      categories,
      averagePrice,
      priceRange: {
        min: minPrice,
        max: maxPrice
      }
    };
  });

  constructor() {
    // Effect for logging when items are loaded
    effect(() => {
      const items = this.flattenedItems();
      if (items.length > 0 && environment.enableLogging) {
        console.log('🍽️ Items loaded:', items.length);
      }
    });

    // Effect for logging search activity
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

    const data = await response.json() as SearchMenuResponse;
    return data.items.map(item => this.transformToLegacyFormat(item));
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
    return this.transformToLegacyFormat(data.item);
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
    return data.items.map((item: MenuItem) => this.transformToLegacyFormat(item));
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
    this.loadAllItems.reload();
  }

  // Helper method to generate mock items for development
  private generateMockItems(): any[] {
    return [
      {
        id: 'mock1',
        uniqueId: 'mock1',
        name: 'Sample Burger',
        description: 'Delicious sample burger',
        category_id: 'cat1',
        is_veg: 'NON_VEG',
        price: 250,
        packing_charges: 20,
        image_url: 'https://picsum.photos/300/200?random=1',
        in_stock: 1,
        enabled: 1,
        variants: null,
        addons: null,
        recommended: true
      },
      {
        id: 'mock2',
        uniqueId: 'mock2',
        name: 'Veggie Pizza',
        description: 'Fresh vegetarian pizza',
        category_id: 'cat2',
        is_veg: 'VEG',
        price: 300,
        packing_charges: 25,
        image_url: 'https://picsum.photos/300/200?random=2',
        in_stock: 1,
        enabled: 1,
        variants: null,
        addons: null,
        recommended: false
      }
    ];
  }

  // Getters for convenience
  get isLoading(): boolean {
    return this.menuResource.isLoading() || this.loadAllItems.isLoading();
  }

  get error(): any {
    return this.menuResource.error() || this.loadAllItems.error();
  }

  get hasError(): boolean {
    return this.menuResource.status() === 'error' || this.loadAllItems.status() === 'error';
  }

  // Mock data for development/fallback
  private getMockMenuData(): MenuResponse {
    return {
      categories: [
        {
          id: 'cat1',
          name: 'Main Courses',
          displayOrder: 1,
          itemCount: 5,
          subcategories: []
        },
        {
          id: 'cat2',
          name: 'Appetizers',
          displayOrder: 2,
          itemCount: 3,
          subcategories: []
        }
      ],
      totalItems: 8,
      totalCategories: 2,
      lastUpdated: new Date()
    };
  }
}
