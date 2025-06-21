// Re-export all menu APIs from their respective files for backward compatibility
// This file serves as the main entry point for all menu-related operations

// Category-related exports
export {
  getMenu,
  getMenuCategory,
  getMenuCategories,
  createMenuCategory
} from "./category";

// Item-related exports
export {
  getMenuItem,
  searchMenu,
  createMenuItem
} from "./item";

// Note: The menu functionality has been refactored into separate files:
// - category.ts: Contains all category-related operations
// - item.ts: Contains all item-related operations
// This file maintains backward compatibility by re-exporting all functions
