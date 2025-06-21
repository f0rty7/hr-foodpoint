import { api, Query } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { food } from "./food";
import log from "encore.dev/log";
import { MenuItem } from "./types";

interface MenuItemDetailsResponse {
  item: MenuItem;
  category_info: {
    main_category_id: string;
    main_category_name: string;
    sub_category_id: string;
    sub_category_name: string;
  };
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

// Request interfaces for creating menu items
interface CreateMenuItemRequest {
  name: string;
  description: string;
  main_category_id: string;
  sub_category_id?: string;
  sub_category_name?: string;
  is_veg: "VEG" | "NON_VEG";
  price: number;
  packing_charges?: number;
  image_url?: string;
  variants?: any;
  addons?: any;
  recommended?: boolean;
}

interface CreateMenuItemResponse {
  id: string;
  uniqueId: string;
  name: string;
  description: string;
  category_info: {
    main_category_id: string;
    main_category_name: string;
    sub_category_id: string;
    sub_category_name: string;
  };
  message: string;
}

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

// Create a new menu item
export const createMenuItem = api(
  {
    method: "POST",
    path: "/menu/items",
    auth: true,
    expose: true
  },
  async (params: CreateMenuItemRequest): Promise<CreateMenuItemResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Creating new menu item", {
      userId: authData.userID,
      email: authData.email,
      itemName: params.name,
      categoryId: params.main_category_id
    });

    // Validate required fields
    if (!params.name || params.name.trim().length === 0) {
      throw new Error("Item name is required");
    }

    if (!params.description || params.description.trim().length === 0) {
      throw new Error("Item description is required");
    }

    if (!params.main_category_id || params.main_category_id.trim().length === 0) {
      throw new Error("Main category ID is required");
    }

    if (params.price === undefined || params.price < 0) {
      throw new Error("Valid price is required");
    }

    if (!["VEG", "NON_VEG"].includes(params.is_veg)) {
      throw new Error("is_veg must be either 'VEG' or 'NON_VEG'");
    }

    // Check if main category exists
    const existingCategoryItem = food.items_vo.find(item =>
      item.main_category_id === params.main_category_id
    );

    if (!existingCategoryItem) {
      throw new Error(`Main category with ID "${params.main_category_id}" does not exist`);
    }

    // Handle subcategory
    let subCategoryId = params.sub_category_id;
    let subCategoryName = params.sub_category_name;

    if (!subCategoryId) {
      // Create a default subcategory if not provided
      subCategoryId = `subcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      subCategoryName = subCategoryName || "Other";
    } else {
      // Validate subcategory exists in the main category
      const existingSubCategory = food.items_vo.find(item =>
        item.main_category_id === params.main_category_id &&
        item.sub_category_id === subCategoryId
      );

      if (!existingSubCategory && !subCategoryName) {
        throw new Error("Sub category name is required when creating new subcategory");
      }

      if (existingSubCategory) {
        subCategoryName = existingSubCategory.sub_category_name;
      }
    }

    // Generate new item IDs
    const newItemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUniqueId = `unique_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the new menu item with full structure
    const newMenuItem = {
      id: newItemId,
      uniqueId: newUniqueId,
      name: params.name.trim(),
      third_party_id: "",
      description: params.description.trim(),
      category_id: params.main_category_id,
      third_party_category_name: "",
      third_party_category_order: 0,
      sub_category_id: "0",
      third_party_sub_category_name: "",
      third_party_sub_category_order: 0,
      is_veg: params.is_veg,
      price: params.price,
      service_charges: "0",
      service_tax: "0",
      vat: "0",
      packing_charges: params.packing_charges || 0,
      packing_slab_count: 1,
      is_spicy: "",
      serves_how_many: 1,
      enabled: 1,
      in_stock: 1,
      addon_free_limit: -1,
      addon_limit: -1,
      is_perishable: 1,
      image_url: params.image_url || "",
      image_id: "",
      s3_image_url: params.image_url || "",
      variants: params.variants || null,
      variants_v2: null,
      addons: params.addons || null,
      comment: "",
      variant_description: "",
      addon_description: "",
      active: true,
      created_by: "API-USER",
      created_at: Date.now(),
      updated_by: "API-USER",
      updated_at: Date.now(),
      created_on: Date.now(),
      updated_on: Date.now(),
      gst_details: {
        sgst: "[SUBTOTAL]*0.025",
        cgst: "[SUBTOTAL]*0.025",
        igst: "[SUBTOTAL]*0.0",
        inclusive: false,
        gst_liability: "SWIGGY"
      },
      recommended: params.recommended || false,
      type: "REGULAR_ITEM",
      is_discoverable: true,
      commission: "",
      batch_info: null,
      item_sub_info: null,
      eligible_for_long_distance: 1,
      preparation_style: "",
      restaurant_id: 1059367,
      order: 10000,
      catalog_attributes: {
        entityId: "0",
        entityType: "",
        quantity: null,
        prep_style: "",
        serves_how_many: 0,
        serves_how_many_upper_limit: 0,
        spice_level: "",
        veg_classifier: params.is_veg,
        packaging: "",
        cutlery: "",
        accompaniments: null,
        allergen_info: "",
        sweet_level: "",
        gravy_property: "",
        bone_property: "",
        contain_seasonal_ingredients: false
      },
      catalog_multi_value_attributes: [],
      crop_choices: 2,
      pop_usage_type: "",
      commission_code: "",
      tax_code: "",
      hsn: "",
      availability: {
        available: true,
        next_change_time_text: "",
        next_change_time: ""
      }
    };

    // Create the ItemVO structure with all required properties
    const newItemVO = {
      main_category_id: params.main_category_id,
      main_category_name: existingCategoryItem.main_category_name,
      main_category_order: existingCategoryItem.main_category_order,
      sub_category_id: subCategoryId!,
      sub_category_name: subCategoryName!,
      sub_category_order: 1, // Default order
      item: newMenuItem,
      item_slot: null,
      item_holiday_slots: null,
      variant_groups_vo: [],
      delete_variant_group_by_ids: null,
      delete_by_variant_group_id_error_map: null,
      addon_groups_vo: [],
      delete_addon_group_by_ids: null,
      delete_addon_group_by_id_error_map: null,
      status: 0,
      error: null,
      main_category_third_party_id: "",
      sub_category_third_party_id: "",
      pricing_models: null,
      default_dependent_variants_map: null
    };

    // Add the new item to the food data (in a real app, this would be saved to database)
    food.items_vo.push(newItemVO);

    log.info("Menu item created", {
      userId: authData.userID,
      itemId: newItemId,
      itemName: params.name,
      categoryId: params.main_category_id,
      subCategoryId: subCategoryId,
      price: params.price
    });

    return {
      id: newItemId,
      uniqueId: newUniqueId,
      name: params.name.trim(),
      description: params.description.trim(),
      category_info: {
        main_category_id: params.main_category_id,
        main_category_name: existingCategoryItem.main_category_name,
        sub_category_id: subCategoryId!,
        sub_category_name: subCategoryName!
      },
      message: "Menu item created successfully"
    };
  }
);
