import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { food } from "./food";
import log from "encore.dev/log";

// Types for the food menu structure
interface MenuItem {
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

interface SubCategory {
  id: string;
  name: string;
  items_order: Array<{ id: string; name: string; }>;
}

interface MainCategory {
  id: string;
  name: string;
  main_category_order: number;
  sub_categories_order: SubCategory[];
}

interface ItemVO {
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

interface MenuResponse {
  categories: MainCategory[];
  total_items: number;
  total_categories: number;
  out_of_stock_categories: string[];
  out_of_stock_sub_categories: string[];
  all_items: ItemVO[];
}

interface MenuItemDetailsResponse {
  item: MenuItem;
  category_info: {
    main_category_id: string;
    main_category_name: string;
    sub_category_id: string;
    sub_category_name: string;
  };
}

interface MenuCategoryResponse {
  category: MainCategory;
  items: MenuItem[];
}

interface SearchMenuRequest {
  query: Query<string>;
  category?: Query<string>;
  veg_only?: Query<boolean>;
  max_price?: Query<number>;
  min_price?: Query<number>;
  in_stock_only?: Query<boolean>;
}

interface SearchMenuResponse {
  items: MenuItem[];
  total_results: number;
  search_query: string;
  filters_applied: {
    category?: string;
    veg_only?: boolean;
    max_price?: number;
    min_price?: number;
    in_stock_only?: boolean;
  };
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

// Get detailed information about a specific menu item
export const getMenuItem = api(
  {
    method: "GET",
    path: "/menu/item/:itemId",
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

    // Find the item in the food data
    const itemData = food.items_vo.find(item => item.item.id === itemId);

    if (!itemData) {
      throw new Error(`Menu item with ID ${itemId} not found`);
    }

    return {
      item: itemData.item as MenuItem,
      category_info: {
        main_category_id: itemData.main_category_id,
        main_category_name: itemData.main_category_name,
        sub_category_id: itemData.sub_category_id,
        sub_category_name: itemData.sub_category_name
      }
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
      items: categoryItems.map(item => item.item as MenuItem)
    };
  }
);

// Search menu items with filters
export const searchMenu = api(
  {
    method: "GET",
    path: "/menu/search",
    auth: true,
    expose: true
  },
  async (params: SearchMenuRequest): Promise<SearchMenuResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Menu search requested", {
      userId: authData.userID,
      email: authData.email,
      searchParams: params
    });

    let filteredItems = food.items_vo;

    // Apply search query filter
    if (params.query) {
      const searchTerm = params.query.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        item.item.name.toLowerCase().includes(searchTerm) ||
        item.item.description.toLowerCase().includes(searchTerm) ||
        item.main_category_name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (params.category) {
      const categoryFilter = params.category;
      filteredItems = filteredItems.filter(item =>
        item.main_category_id === categoryFilter ||
        item.main_category_name.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Apply vegetarian filter
    if (params.veg_only === true) {
      filteredItems = filteredItems.filter(item =>
        item.item.is_veg === "VEG"
      );
    }

    // Apply price filters
    if (params.min_price !== undefined) {
      filteredItems = filteredItems.filter(item =>
        item.item.price >= params.min_price!
      );
    }

    if (params.max_price !== undefined) {
      filteredItems = filteredItems.filter(item =>
        item.item.price <= params.max_price!
      );
    }

    // Apply in stock filter
    if (params.in_stock_only === true) {
      filteredItems = filteredItems.filter(item =>
        item.item.in_stock === 1 && item.item.enabled === 1
      );
    }

    return {
      items: filteredItems.map(item => item.item as MenuItem),
      total_results: filteredItems.length,
      search_query: params.query || "",
      filters_applied: {
        category: params.category,
        veg_only: params.veg_only,
        max_price: params.max_price,
        min_price: params.min_price,
        in_stock_only: params.in_stock_only
      }
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
