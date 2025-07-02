import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import log from "encore.dev/log";
import { FoodRepository } from "./repository";
import {
  MenuItemDetailsResponse,
  SearchMenuResponse,
  CreateMenuItemRequest
} from "./types";

const foodRepo = FoodRepository.getInstance();

// Get detailed information about a specific menu item
export const getMenuItem = api(
  {
    method: "GET",
    path: "/api/menu/item/:itemId",
    auth: true,
    expose: true
  },
  async ({ itemId }: { itemId: string }): Promise<MenuItemDetailsResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Menu item requested", {
      userId: authData.userID,
      email: authData.email,
      itemId
    });

    try {
      const restaurantId = "default"; // You can make this dynamic
      return await foodRepo.getMenuItem(itemId, restaurantId);
    } catch (error) {
      log.error(error, "Failed to get menu item", {
        userId: authData.userID,
        itemId
      });
      throw error;
    }
  }
);

// Search menu items with advanced filters
export const searchMenu = api(
  {
    method: "GET",
    path: "/api/menu/search",
    auth: true,
    expose: true
  },
  async (params: {
    query?: Query<string>;
    category?: Query<string>;
    subcategory?: Query<string>;
    veg_only?: Query<boolean>;
    in_stock_only?: Query<boolean>;
    max_price?: Query<number>;
    min_price?: Query<number>;
    recommended_only?: Query<boolean>;
    tags?: Query<string>;
    limit?: Query<number>;
    skip?: Query<number>;
    sort_by?: Query<string>;
    sort_order?: Query<'asc' | 'desc'>;
  }): Promise<SearchMenuResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Menu search requested", {
      userId: authData.userID,
      email: authData.email,
      searchParams: params
    });

    try {
      const restaurantId = "default";

      const searchParams = {
        restaurantId,
        query: params.query,
        categoryId: params.category,
        subcategoryId: params.subcategory,
        vegOnly: params.veg_only,
        inStockOnly: params.in_stock_only,
        minPrice: params.min_price,
        maxPrice: params.max_price,
        isRecommended: params.recommended_only,
        tags: params.tags ? params.tags.split(',').map(t => t.trim()) : undefined,
        limit: params.limit || 20,
        skip: params.skip || 0,
        sortBy: params.sort_by || 'displayOrder',
        sortOrder: (params.sort_order || 'asc') as 'asc' | 'desc'
      };

      return await foodRepo.searchMenuItems(searchParams);
    } catch (error) {
      log.error(error, "Failed to search menu items", {
        userId: authData.userID,
        params
      });
      throw error;
    }
  }
);

// Create a new menu item
export const createMenuItem = api(
  {
    method: "POST",
    path: "/api/menu/items",
    auth: true,
    expose: true
  },
  async (params: CreateMenuItemRequest): Promise<{ id: string; message: string }> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Creating menu item", {
      userId: authData.userID,
      email: authData.email,
      itemName: params.name
    });

    try {
      const restaurantId = "default"; // You can make this dynamic

      const itemData = {
        restaurantId,
        categoryId: params.categoryId,
        subcategoryId: params.subcategoryId,
        name: params.name,
        slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: params.description,
        shortDescription: params.description.substring(0, 100),
        basePrice: params.basePrice,
        packingCharges: params.packingCharges || 0,
        isVeg: params.isVeg,
        spiceLevel: params.spiceLevel,
        servingSize: params.servingSize || 1,
        images: params.images,
        isActive: true,
        isInStock: true,
        isRecommended: params.isRecommended || false,
        isPopular: false,
        tags: params.tags || [],
        allergens: params.allergens || [],
        variantGroups: params.variantGroups || [],
        addonGroupIds: params.addonGroupIds || [],
        orderCount: 0,
        rating: 0,
        reviewCount: 0,
        displayOrder: 999
      };

      const itemId = await foodRepo.createMenuItem(itemData);

      return {
        id: itemId,
        message: `Menu item '${params.name}' created successfully`
      };
    } catch (error) {
      log.error(error, "Failed to create menu item", {
        userId: authData.userID,
        itemName: params.name
      });
      throw error;
    }
  }
);

// Update an existing menu item
export const updateMenuItem = api(
  {
    method: "PUT",
    path: "/api/menu/items/:itemId",
    auth: true,
    expose: true
  },
  async ({ itemId, ...params }: { itemId: string } & CreateMenuItemRequest): Promise<{ id: string; message: string }> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Updating menu item", {
      userId: authData.userID,
      email: authData.email,
      itemId,
      itemName: params.name
    });

    try {
      const restaurantId = "default"; // You can make this dynamic

      // Check if item exists
      const existingItem = await foodRepo.getMenuItem(itemId, restaurantId);
      if (!existingItem) {
        throw new Error(`Menu item with ID ${itemId} not found`);
      }

      const itemData = {
        restaurantId,
        categoryId: params.categoryId,
        subcategoryId: params.subcategoryId,
        name: params.name,
        slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: params.description,
        shortDescription: params.description.substring(0, 100),
        basePrice: params.basePrice,
        packingCharges: params.packingCharges || 0,
        isVeg: params.isVeg,
        spiceLevel: params.spiceLevel,
        servingSize: params.servingSize || 1,
        images: params.images,
        isActive: true,
        isInStock: true,
        isRecommended: params.isRecommended || false,
        isPopular: false,
        tags: params.tags || [],
        allergens: params.allergens || [],
        variantGroups: params.variantGroups || [],
        addonGroupIds: params.addonGroupIds || [],
        orderCount: existingItem.item.orderCount || 0,
        rating: existingItem.item.rating || 0,
        reviewCount: existingItem.item.reviewCount || 0,
        displayOrder: existingItem.item.displayOrder || 999,
        updatedAt: new Date()
      };

      await foodRepo.updateMenuItem(itemId, itemData);

      return {
        id: itemId,
        message: `Menu item '${params.name}' updated successfully`
      };
    } catch (error) {
      log.error(error, "Failed to update menu item", {
        userId: authData.userID,
        itemId,
        itemName: params.name
      });
      throw error;
    }
  }
);
