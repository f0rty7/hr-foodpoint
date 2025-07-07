import { Injectable, signal, computed, effect } from '@angular/core';
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

type Filters = {
  query: string;
  category?: string;
  vegOnly: boolean;
  inStockOnly: boolean;
  priceRange: { min?: number; max?: number };
  sortBy: 'name' | 'price' | 'popularity';
  sortOrder: 'asc' | 'desc';
};

@Injectable({
  providedIn: 'root'
})
export class FoodListingService {
  private readonly API_BASE_URL = environment.apiUrl;

  // State signals
  readonly filters = signal<Filters>({
    query: '',
    category: undefined,
    vegOnly: false,
    inStockOnly: true,
    priceRange: {},
    sortBy: 'popularity',
    sortOrder: 'asc',
  });

  private menuItems = signal<MenuItem[]>([]);
  private debounceTimer: any;

  // Public signals for components
  readonly categories = signal<MenuCategory[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly filteredItems = computed(() => this.menuItems());

  readonly menuStats = computed(() => {
    const items = this.menuItems();
    const totalItems = items.length;
    const vegItems = items.filter(item => item.isVeg).length;
    const categoriesCount = this.categories().length;

    const prices = items.map(item => item.basePrice).filter(price => price > 0);
    const averagePrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      totalItems,
      vegItems,
      categories: categoriesCount,
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice }
    };
  });

  constructor() {
    this.loadCategories();
    effect(() => {
      const currentFilters = this.filters();
      clearTimeout(this.debounceTimer);
      this.isLoading.set(true);
      this.debounceTimer = setTimeout(() => {
        this.searchMenuItems(currentFilters);
      }, 300);
    });
  }

  private async loadCategories() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication token not found.');
      const response = await fetch(`${this.API_BASE_URL}menu`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
      const data: MenuResponse = await response.json();
      this.categories.set(data.categories);
    } catch (e) {
      console.error('Failed to fetch categories:', e);
      if (!environment.production) this.categories.set(this.getMockMenuData().categories);
    }
  }

  private async searchMenuItems(filters: Filters) {
    this.hasError.set(false);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Authentication required');
      const params = new URLSearchParams({ limit: '1000' });
      if (filters.query) params.set('query', filters.query);
      if (filters.category) params.set('category', filters.category);
      if (filters.vegOnly) params.set('veg_only', 'true');
      if (filters.inStockOnly) params.set('in_stock_only', 'true');

      const response = await fetch(`${this.API_BASE_URL}menu/search?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`Search failed: ${response.status}`);
      const data: SearchMenuResponse = await response.json();
      const transformedItems = data.items.map(item => this.transformToLegacyFormat(item));
      this.menuItems.set(transformedItems);
    } catch (e) {
      console.error('Failed to search menu items:', e);
      this.hasError.set(true);
       if (!environment.production) {
          const mockItems = this.generateMockItems();
          const filteredMock = mockItems.filter(item => item.name.toLowerCase().includes(filters.query.toLowerCase()));
          this.menuItems.set(filteredMock);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private transformToLegacyFormat(item: MenuItem): any {
    return { ...item, id: item._id, is_veg: item.isVeg ? 'VEG' : 'NON_VEG', price: item.basePrice };
  }

  // Update methods for filters
  updateSearchQuery(query: string): void { this.filters.update(f => ({ ...f, query })); }
  updateSelectedCategory(categoryId: string | undefined): void { this.filters.update(f => ({ ...f, category: categoryId })); }
  updatePriceRange(min?: number, max?: number): void { this.filters.update(f => ({ ...f, priceRange: { min, max } })); }
  updateVegOnly(vegOnly: boolean): void { this.filters.update(f => ({ ...f, vegOnly })); }
  updateInStockOnly(inStockOnly: boolean): void { this.filters.update(f => ({ ...f, inStockOnly })); }
  updateSorting(sortBy: 'name' | 'price' | 'popularity', order: 'asc' | 'desc' = 'asc'): void { this.filters.update(f => ({ ...f, sortBy, sortOrder: order })); }

  refreshMenu(): void {
    this.loadCategories();
    this.filters.update(f => ({...f}));
  }

  private generateMockItems(): any[] {
    return [
      { _id: '1', name: 'Mock Burger', description: 'A tasty mock burger', categoryId: 'cat1', subcategoryId: 'sub1', basePrice: 150, packingCharges: 10, isVeg: true, images: { primary: '' }, isInStock: true, isActive: true, isRecommended: true, tags: [], slug: 'mock-burger' },
      { _id: '2', name: 'Mock Pizza', description: 'A cheesy mock pizza', categoryId: 'cat1', subcategoryId: 'sub1', basePrice: 250, packingCharges: 15, isVeg: true, images: { primary: '' }, isInStock: true, isActive: true, isRecommended: false, tags: [], slug: 'mock-pizza' }
    ].map(item => this.transformToLegacyFormat(item));
  }

  private getMockMenuData(): MenuResponse {
    return {
      categories: [{ id: 'cat1', name: 'Mock Category', displayOrder: 1, itemCount: 2, subcategories: [] }],
      totalItems: 2,
      totalCategories: 1,
      lastUpdated: new Date()
    };
  }
}
