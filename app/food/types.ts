// Shared types for food menu system

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
  item: any;
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

export interface MenuCategoryResponse {
  category: MainCategory;
  items: any[];
}
