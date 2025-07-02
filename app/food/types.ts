// Updated MongoDB-optimized types for food menu system

// ================== CORE MONGODB ENTITIES ==================

export interface Restaurant {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  settings: {
    isActive: boolean;
    acceptsOnlineOrders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  _id?: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  subcategories: SubCategory[];
  itemCount: number; // Denormalized for performance
  createdAt: Date;
  updatedAt: Date;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  itemCount: number;
}

export interface MenuItem {
  _id?: string;
  restaurantId: string;
  categoryId: string;
  subcategoryId?: string;

  // Basic Info
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;

  // Pricing
  basePrice: number;
  packingCharges: number;

  // Classification
  isVeg: boolean;
  spiceLevel?: 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
  servingSize: number;

  // Media
  images: {
    primary: string;
    gallery?: string[];
  };

  // Availability
  isActive: boolean;
  isInStock: boolean;
  isRecommended: boolean;
  isPopular: boolean;

  // SEO and Discovery
  tags: string[];
  allergens?: string[];

  // Variants (embedded for performance)
  variantGroups?: VariantGroup[];

  // Addons (reference for flexibility)
  addonGroupIds?: string[];

  // Analytics (denormalized)
  orderCount: number;
  rating: number;
  reviewCount: number;

  // Display
  displayOrder: number;

  // Search optimization
  searchText?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantGroup {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelections: number;
  displayOrder: number;
  variants: Variant[];
}

export interface Variant {
  id: string;
  name: string;
  priceModifier: number;
  isDefault: boolean;
  isAvailable: boolean;
  displayOrder: number;
}

export interface AddonGroup {
  _id?: string;
  restaurantId: string;
  name: string;
  description?: string;
  isRequired: boolean;
  maxSelections: number;
  minSelections: number;
  displayOrder: number;
  addons: Addon[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  displayOrder: number;
  isVeg: boolean;
}

// ================== OPTIMIZED VIEWS ==================

export interface MenuView {
  _id?: string;
  restaurantId: string;
  version: number;
  categories: {
    id: string;
    name: string;
    slug: string;
    displayOrder: number;
    itemCount: number;
    subcategories: {
      id: string;
      name: string;
      slug: string;
      displayOrder: number;
      itemCount: number;
    }[];
  }[];
  lastUpdated: Date;
  isActive: boolean;
}

// ================== API RESPONSE TYPES ==================

export interface MenuResponse {
  categories: {
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
  }[];
  totalItems: number;
  totalCategories: number;
  lastUpdated: Date;
}

export interface MenuCategoryResponse {
  category: {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    subcategories: SubCategory[];
  };
  items: MenuItem[];
  totalItems: number;
}

export interface MenuItemDetailsResponse {
  item: MenuItem;
  categoryInfo: {
    categoryId: string;
    categoryName: string;
    subcategoryId?: string;
    subcategoryName?: string;
  };
  relatedItems?: MenuItem[];
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
  facets?: {
    categories: { id: string; name: string; count: number; }[];
    priceRanges: { min: number; max: number; count: number; }[];
    tags: { tag: string; count: number; }[];
  };
}

// ================== REQUEST TYPES ==================

export interface CreateMenuItemRequest {
  name: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  isVeg: boolean;
  basePrice: number;
  packingCharges?: number;
  images: {
    primary: string;
    gallery?: string[];
  };
  spiceLevel?: 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';
  tags: string[];
  allergens?: string[];
  variantGroups?: VariantGroup[];
  addonGroupIds?: string[];
  isRecommended?: boolean;
  servingSize?: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  subcategories?: {
    name: string;
    description?: string;
    displayOrder?: number;
  }[];
}

// ================== LEGACY COMPATIBILITY ==================
// Keep these for backward compatibility during migration

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
  item: any;
  item_slot: any;
  item_holiday_slots: any;
  variant_groups_vo: any[];
}
