import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import log from "encore.dev/log";
import { FoodRepository } from "./repository";
import {
  MenuResponse,
  MenuCategoryResponse,
  CreateCategoryRequest
} from "./types";

const foodRepo = FoodRepository.getInstance();

// Initialize indexes on startup
foodRepo.createIndexes().catch(err => {
  log.error(err, "Failed to create indexes on startup");
});

// Get the complete menu with authentication
export const getMenu = api(
  {
    method: "GET",
    path: "/api/menu",
    auth: true,
    expose: true
  },
  async (): Promise<MenuResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Menu requested", {
      userId: authData.userID,
      email: authData.email
    });

    try {
      const restaurantId = "default"; // You can make this dynamic based on user context
      return await foodRepo.getMenuStructure(restaurantId);
    } catch (error) {
      log.error(error, "Failed to get menu", { userId: authData.userID });
      throw error;
    }
  }
);

// Get all items in a specific category
export const getMenuCategory = api(
  {
    method: "GET",
    path: "/api/menu/category/:categoryId",
    auth: true,
    expose: true
  },
  async ({ categoryId }: { categoryId: string }): Promise<MenuCategoryResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Menu category requested", {
      userId: authData.userID,
      email: authData.email,
      categoryId
    });

    try {
      const restaurantId = "default"; // You can make this dynamic
      return await foodRepo.getMenuCategory(categoryId, restaurantId);
    } catch (error) {
      log.error(error, "Failed to get menu category", {
        userId: authData.userID,
        categoryId
      });
      throw error;
    }
  }
);

// Get menu categories only (for navigation)
export const getMenuCategories = api(
  {
    method: "GET",
    path: "/api/menu/categories",
    auth: true,
    expose: true
  },
  async (): Promise<{ categories: MenuResponse['categories'] }> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Menu categories requested", {
      userId: authData.userID,
      email: authData.email
    });

    try {
      const restaurantId = "default";
      const menuStructure = await foodRepo.getMenuStructure(restaurantId);

      return {
        categories: menuStructure.categories
      };
    } catch (error) {
      log.error(error, "Failed to get menu categories", { userId: authData.userID });
      throw error;
    }
  }
);

// Create a new menu category
export const createMenuCategory = api(
  {
    method: "POST",
    path: "/api/menu/categories",
    auth: true,
    expose: true
  },
  async (params: CreateCategoryRequest): Promise<{ id: string; message: string }> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Creating menu category", {
      userId: authData.userID,
      email: authData.email,
      categoryName: params.name
    });

    try {
      const restaurantId = "default"; // You can make this dynamic

      const categoryData = {
        restaurantId,
        name: params.name,
        slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: params.description,
        imageUrl: params.imageUrl,
        displayOrder: params.displayOrder || 999,
        isActive: true,
        subcategories: (params.subcategories || []).map((sub, index) => ({
          id: `sub_${Date.now()}_${index}`,
          name: sub.name,
          slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: sub.description,
          displayOrder: sub.displayOrder || index,
          isActive: true,
          itemCount: 0
        }))
      };

      const categoryId = await foodRepo.createCategory(categoryData);

      return {
        id: categoryId,
        message: `Category '${params.name}' created successfully`
      };
    } catch (error) {
      log.error(error, "Failed to create category", {
        userId: authData.userID,
        categoryName: params.name
      });
      throw error;
    }
  }
);
