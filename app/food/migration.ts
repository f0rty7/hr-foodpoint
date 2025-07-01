import { api } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { FoodRepository } from "./repository";
import { food } from "./food";
import log from "encore.dev/log";

const foodRepo = FoodRepository.getInstance();

interface MigrationResponse {
  message: string;
  categoriesCreated: number;
  itemsCreated: number;
  warnings: string[];
}

// Migrate static data to MongoDB
export const migrateStaticDataToMongoDB = api(
  {
    method: "POST",
    path: "/api/menu/migrate",
    auth: true,
    expose: true
  },
  async (): Promise<MigrationResponse> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Starting migration from static data to MongoDB", {
      userId: authData.userID,
      email: authData.email
    });

    const warnings: string[] = [];
    let categoriesCreated = 0;
    let itemsCreated = 0;

    try {
      const restaurantId = "default";

      // First, create indexes
      await foodRepo.createIndexes();

      // Get existing categories from MongoDB to create mapping
      const categoriesCollection = await foodRepo['getCategoriesCollection']();
      const existingCategories = await categoriesCollection.find({ restaurantId }).toArray();

      // Create mapping from category name to MongoDB category ID
      const categoryNameToIdMap = new Map<string, string>();
      existingCategories.forEach(cat => {
        categoryNameToIdMap.set(cat.name, cat._id.toString());
      });

      // Build category structure from static data
      const categoryMap = new Map<string, {
        id: string;
        name: string;
        order: number;
        subcategories: Map<string, { id: string; name: string; order: number; }>
      }>();

      // Extract categories and subcategories from static data
      for (const item of food.items_vo) {
        const mainCategoryId = item.main_category_id;
        const mainCategoryName = item.main_category_name;
        const mainCategoryOrder = item.main_category_order;
        const subCategoryId = item.sub_category_id;
        const subCategoryName = item.sub_category_name;
        const subCategoryOrder = item.sub_category_order;

        if (!categoryMap.has(mainCategoryId)) {
          categoryMap.set(mainCategoryId, {
            id: mainCategoryId,
            name: mainCategoryName,
            order: mainCategoryOrder,
            subcategories: new Map()
          });
        }

        const category = categoryMap.get(mainCategoryId)!;
        if (!category.subcategories.has(subCategoryId)) {
          category.subcategories.set(subCategoryId, {
            id: subCategoryId,
            name: subCategoryName,
            order: subCategoryOrder
          });
        }
      }

      // Create categories only if they don't exist in MongoDB
      for (const [categoryId, categoryData] of categoryMap) {
        try {
          if (!categoryNameToIdMap.has(categoryData.name)) {
            const subcategoriesArray = Array.from(categoryData.subcategories.values()).map(sub => ({
              id: sub.id,
              name: sub.name,
              slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: undefined,
              displayOrder: sub.order,
              isActive: true,
              itemCount: 0
            }));

            const newCategoryData = {
              restaurantId,
              name: categoryData.name,
              slug: categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              description: undefined,
              imageUrl: undefined,
              displayOrder: categoryData.order,
              isActive: true,
              subcategories: subcategoriesArray
            };

            const newCategoryId = await foodRepo.createCategory(newCategoryData);
            categoryNameToIdMap.set(categoryData.name, newCategoryId);
            categoriesCreated++;

            log.info("Category created", {
              originalId: categoryId,
              newId: newCategoryId,
              name: categoryData.name
            });
          } else {
            log.info("Category already exists, skipping", {
              name: categoryData.name,
              existingId: categoryNameToIdMap.get(categoryData.name)
            });
          }
        } catch (error) {
          warnings.push(`Failed to create category ${categoryData.name}: ${error}`);
          log.error(error, "Failed to create category during migration", { categoryId, categoryData });
        }
      }

      // Create menu items with proper category references
      for (const itemData of food.items_vo) {
        try {
          const item = itemData.item;

          // Find the MongoDB category ID using the category name
          const categoryName = itemData.main_category_name;
          const mongodbCategoryId = categoryNameToIdMap.get(categoryName);

          if (!mongodbCategoryId) {
            warnings.push(`Category not found for item ${item.name}: ${categoryName}`);
            continue;
          }

          // Use subcategory ID from static data (this will be matched in the category's subcategories)
          const subcategoryId = itemData.sub_category_id;

          const newItemData = {
            restaurantId,
            categoryId: mongodbCategoryId, // Use MongoDB category ID
            subcategoryId,
            name: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: item.description,
            shortDescription: item.description.substring(0, 100),
            basePrice: item.price,
            packingCharges: item.packing_charges,
            isVeg: item.is_veg === "VEG",
            spiceLevel: item.is_spicy ? "MEDIUM" : "MILD" as "MILD" | "MEDIUM" | "HOT" | "EXTRA_HOT",
            servingSize: item.serves_how_many || 1,
            images: {
              primary: item.image_url || "",
              gallery: []
            },
            isActive: Boolean(item.enabled && item.active),
            isInStock: Boolean(item.in_stock),
            isRecommended: Boolean(item.recommended),
            isPopular: false,
            tags: [
              item.is_veg === "VEG" ? "vegetarian" : "non-vegetarian",
              ...(item.is_spicy ? ["spicy"] : []),
              ...(item.catalog_attributes?.veg_classifier ? [item.catalog_attributes.veg_classifier.toLowerCase()] : [])
            ].filter(Boolean),
            allergens: [],
            variantGroups: itemData.variant_groups_vo?.map((vg, index) => ({
              id: vg.variant_group?.id || `vg_${index}`,
              name: vg.variant_group?.name || `Variant Group ${index + 1}`,
              isRequired: true,
              maxSelections: 1,
              displayOrder: vg.variant_group?.order || index,
              variants: vg.variants_vo?.map((v, vIndex) => ({
                id: v.variant?.id || `v_${vIndex}`,
                name: v.variant?.name || `Variant ${vIndex + 1}`,
                priceModifier: v.variant?.price || 0,
                isDefault: Boolean(v.variant?.default),
                isAvailable: Boolean(v.variant?.in_stock),
                displayOrder: v.variant?.order || vIndex
              })) || []
            })) || [],
            addonGroupIds: [],
            orderCount: 0,
            rating: 0,
            reviewCount: 0,
            displayOrder: item.order || 999
          };

          const newItemId = await foodRepo.createMenuItem(newItemData);
          itemsCreated++;

          log.info("Item migrated", {
            originalId: item.id,
            newId: newItemId,
            name: item.name,
            categoryId: mongodbCategoryId
          });
                } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          warnings.push(`Failed to create item ${itemData.item.name}: ${errorMessage}`);
          log.error(error, "Failed to create item during migration", {
            itemId: itemData.item.id,
            itemName: itemData.item.name,
            error: errorMessage
          });
        }
      }

      log.info("Migration completed", {
        userId: authData.userID,
        categoriesCreated,
        itemsCreated,
        warningsCount: warnings.length
      });

      return {
        message: "Migration completed successfully",
        categoriesCreated,
        itemsCreated,
        warnings
      };
    } catch (error) {
      log.error(error, "Migration failed", { userId: authData.userID });
      throw error;
    }
  }
);

// Clear all MongoDB data (use with caution!)
export const clearMongoDBData = api(
  {
    method: "DELETE",
    path: "/api/menu/clear-db",
    auth: true,
    expose: true
  },
  async (): Promise<{ message: string; deletedCount: number }> => {
    const authData = getAuthData();
    if (!authData) {
      throw new Error("Authentication required");
    }

    log.info("Clearing MongoDB data", {
      userId: authData.userID,
      email: authData.email
    });

    try {
      // Note: This is a destructive operation - use only for development
      const menuItemsCollection = await foodRepo['getMenuItemsCollection']();
      const categoriesCollection = await foodRepo['getCategoriesCollection']();
      const menuViewsCollection = await foodRepo['getMenuViewsCollection']();

      const [itemsResult, categoriesResult, viewsResult] = await Promise.all([
        menuItemsCollection.deleteMany({}),
        categoriesCollection.deleteMany({}),
        menuViewsCollection.deleteMany({})
      ]);

      const totalDeleted = itemsResult.deletedCount + categoriesResult.deletedCount + viewsResult.deletedCount;

      log.info("MongoDB data cleared", {
        userId: authData.userID,
        itemsDeleted: itemsResult.deletedCount,
        categoriesDeleted: categoriesResult.deletedCount,
        viewsDeleted: viewsResult.deletedCount
      });

      return {
        message: "MongoDB data cleared successfully",
        deletedCount: totalDeleted
      };
    } catch (error) {
      log.error(error, "Failed to clear MongoDB data", { userId: authData.userID });
      throw error;
    }
  }
);
