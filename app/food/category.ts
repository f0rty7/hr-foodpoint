import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { food } from "./food";
import log from "encore.dev/log";
import { MainCategory, SubCategory, ItemVO, MenuResponse, MenuCategoryResponse } from "./types";

// Request interfaces for creating menu categories
interface CreateMenuCategoryRequest {
  name: string;
  main_category_order?: number;
}

interface CreateMenuCategoryResponse {
  id: string;
  name: string;
  main_category_order: number;
  message: string;
}

// Get the complete menu with authentication
export const getMenu = api(
  {
    method: "GET",
    path: "/menu",
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

    // Process the food data to create a structured menu
    const categories: MainCategory[] = [];
    const categoryMap = new Map<string, MainCategory>();
    let totalItems = 0;

    // Process items_vo to build the menu structure
    for (const item of food.items_vo) {
      totalItems++;

      const mainCategoryId = item.main_category_id;
      const mainCategoryName = item.main_category_name;
      const subCategoryId = item.sub_category_id;
      const subCategoryName = item.sub_category_name;

      // Get or create main category
      let mainCategory = categoryMap.get(mainCategoryId);
      if (!mainCategory) {
        mainCategory = {
          id: mainCategoryId,
          name: mainCategoryName,
          main_category_order: item.main_category_order,
          sub_categories_order: []
        };
        categoryMap.set(mainCategoryId, mainCategory);
        categories.push(mainCategory);
      }

      // Find or create subcategory
      let subCategory = mainCategory.sub_categories_order.find(sc => sc.id === subCategoryId);
      if (!subCategory) {
        subCategory = {
          id: subCategoryId,
          name: subCategoryName,
          items_order: []
        };
        mainCategory.sub_categories_order.push(subCategory);
      }

      // Add item to subcategory if not already present
      const itemExists = subCategory.items_order.some(i => i.id === item.item.id);
      if (!itemExists) {
        subCategory.items_order.push({
          id: item.item.id,
          name: item.item.name
        });
      }
    }

    // Sort categories by order
    categories.sort((a, b) => a.main_category_order - b.main_category_order);

    return {
      categories,
      total_items: totalItems,
      total_categories: categories.length,
      out_of_stock_categories: food.out_of_stock_categories,
      out_of_stock_sub_categories: food.out_of_stock_sub_categories,
      all_items: food.items_vo
    };
  }
);

// Get all items in a specific category
export const getMenuCategory = api(
  {
    method: "GET",
    path: "/menu/category/:categoryId",
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

    // Find all items in the category
    const categoryItems = food.items_vo.filter(item =>
      item.main_category_id === categoryId
    );

    if (categoryItems.length === 0) {
      throw new Error(`Category with ID ${categoryId} not found or has no items`);
    }

    const firstItem = categoryItems[0];
    const category: MainCategory = {
      id: firstItem.main_category_id,
      name: firstItem.main_category_name,
      main_category_order: firstItem.main_category_order,
      sub_categories_order: []
    };

    // Build subcategories for this category
    const subCategoryMap = new Map<string, SubCategory>();

    for (const item of categoryItems) {
      const subCategoryId = item.sub_category_id;
      const subCategoryName = item.sub_category_name;

      let subCategory = subCategoryMap.get(subCategoryId);
      if (!subCategory) {
        subCategory = {
          id: subCategoryId,
          name: subCategoryName,
          items_order: []
        };
        subCategoryMap.set(subCategoryId, subCategory);
        category.sub_categories_order.push(subCategory);
      }

      const itemExists = subCategory.items_order.some(i => i.id === item.item.id);
      if (!itemExists) {
        subCategory.items_order.push({
          id: item.item.id,
          name: item.item.name
        });
      }
    }

    return {
      category,
      items: categoryItems.map(item => item.item)
    };
  }
);

// Get menu categories only (for navigation)
export const getMenuCategories = api(
  {
    method: "GET",
    path: "/menu/categories",
    auth: true,
    expose: true
  },
    async (): Promise<{ categories: Array<{ id: string; name: string; order: number; item_count: number; }> }> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Menu categories requested", {
      userId: authData.userID,
      email: authData.email
    });

    const categoryMap = new Map<string, { id: string; name: string; order: number; item_count: number; }>();

    // Count items per category
    for (const item of food.items_vo) {
      const categoryId = item.main_category_id;
      const categoryName = item.main_category_name;
      const categoryOrder = item.main_category_order;

      if (categoryMap.has(categoryId)) {
        categoryMap.get(categoryId)!.item_count++;
      } else {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: categoryName,
          order: categoryOrder,
          item_count: 1
        });
      }
    }

    const categories = Array.from(categoryMap.values())
      .sort((a, b) => a.order - b.order);

    return { categories };
  }
);

// Create a new menu category
export const createMenuCategory = api(
  {
    method: "POST",
    path: "/menu/categories",
    auth: true,
    expose: true
  },
  async (params: CreateMenuCategoryRequest): Promise<CreateMenuCategoryResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Creating new menu category", {
      userId: authData.userID,
      email: authData.email,
      categoryName: params.name
    });

    // Validate required fields
    if (!params.name || params.name.trim().length === 0) {
      throw new Error("Category name is required");
    }

    // Check if category with same name already exists
    const existingCategory = food.items_vo.find(item =>
      item.main_category_name.toLowerCase() === params.name.toLowerCase()
    );

    if (existingCategory) {
      throw new Error(`Category with name "${params.name}" already exists`);
    }

    // Generate new category ID
    const newCategoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine category order
    const maxOrder = Math.max(...food.items_vo.map(item => item.main_category_order), 0);
    const categoryOrder = params.main_category_order ?? (maxOrder + 1);

    log.info("Menu category created", {
      userId: authData.userID,
      categoryId: newCategoryId,
      categoryName: params.name,
      order: categoryOrder
    });

    return {
      id: newCategoryId,
      name: params.name.trim(),
      main_category_order: categoryOrder,
      message: "Menu category created successfully"
    };
  }
);
