import { getMongoCollection } from "../shared/mongodb";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";
import {
  Restaurant,
  Category,
  MenuItem,
  AddonGroup,
  MenuView,
  SearchMenuResponse,
  MenuResponse,
  MenuCategoryResponse,
  MenuItemDetailsResponse
} from "./types";

const mongoUrl = secret("MongoDBConnectionString");

export class FoodRepository {
  private static instance: FoodRepository;

  public static getInstance(): FoodRepository {
    if (!FoodRepository.instance) {
      FoodRepository.instance = new FoodRepository();
    }
    return FoodRepository.instance;
  }

  // ================== COLLECTION GETTERS ==================

  private async getRestaurantsCollection() {
    return await getMongoCollection(mongoUrl(), "restaurants");
  }

  private async getCategoriesCollection() {
    return await getMongoCollection(mongoUrl(), "categories");
  }

  private async getMenuItemsCollection() {
    return await getMongoCollection(mongoUrl(), "menu_items");
  }

  private async getAddonGroupsCollection() {
    return await getMongoCollection(mongoUrl(), "addon_groups");
  }

  private async getMenuViewsCollection() {
    return await getMongoCollection(mongoUrl(), "menu_views");
  }

  // ================== MENU OPERATIONS ==================

  async getMenuStructure(restaurantId: string = "default"): Promise<MenuResponse> {
    try {
      // Try to get from optimized menu view first
      const menuViewsCollection = await this.getMenuViewsCollection();
      const menuView = await menuViewsCollection.findOne(
        { restaurantId, isActive: true },
        { sort: { version: -1 } }
      ) as MenuView;

      if (menuView) {
        return {
          categories: menuView.categories,
          totalItems: menuView.categories.reduce((sum, cat) => sum + cat.itemCount, 0),
          totalCategories: menuView.categories.length,
          lastUpdated: menuView.lastUpdated
        };
      }

      // Fallback to building from categories collection
      return await this.buildMenuFromCategories(restaurantId);
    } catch (error) {
      log.error(error, "Failed to get menu structure", { restaurantId });
      throw error;
    }
  }

  private async buildMenuFromCategories(restaurantId: string): Promise<MenuResponse> {
    const categoriesCollection = await this.getCategoriesCollection();

    const categories = await categoriesCollection.find(
      { restaurantId, isActive: true },
      { sort: { displayOrder: 1 } }
    ).toArray() as Category[];

    const menuCategories = categories.map(cat => ({
      id: cat._id!.toString(),
      name: cat.name,
      displayOrder: cat.displayOrder,
      itemCount: cat.itemCount,
      subcategories: cat.subcategories.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        displayOrder: sub.displayOrder,
        itemCount: sub.itemCount
      }))
    }));

    return {
      categories: menuCategories,
      totalItems: categories.reduce((sum, cat) => sum + cat.itemCount, 0),
      totalCategories: categories.length,
      lastUpdated: new Date()
    };
  }

  async getMenuCategory(categoryId: string, restaurantId: string = "default"): Promise<MenuCategoryResponse> {
    try {
      const [category, items] = await Promise.all([
        this.getCategoryById(categoryId, restaurantId),
        this.getItemsByCategory(categoryId, restaurantId)
      ]);

      if (!category) {
        throw new Error(`Category with ID ${categoryId} not found`);
      }

      return {
        category: {
          id: category._id!.toString(),
          name: category.name,
          description: category.description,
          displayOrder: category.displayOrder,
          subcategories: category.subcategories
        },
        items,
        totalItems: items.length
      };
    } catch (error) {
      log.error(error, "Failed to get menu category", { categoryId, restaurantId });
      throw error;
    }
  }

  async getMenuItem(itemId: string, restaurantId: string = "default"): Promise<MenuItemDetailsResponse> {
    try {
      const menuItemsCollection = await this.getMenuItemsCollection();

      const item = await menuItemsCollection.findOne({
        _id: itemId,
        restaurantId,
        isActive: true
      }) as MenuItem;

      if (!item) {
        throw new Error(`Menu item with ID ${itemId} not found`);
      }

      // Get category info
      const category = await this.getCategoryById(item.categoryId, restaurantId);
      const subcategory = category?.subcategories.find(sub => sub.id === item.subcategoryId);

      // Get related items (same category, different items)
      const relatedItems = await this.getRelatedItems(item.categoryId, itemId, restaurantId);

      return {
        item,
        categoryInfo: {
          categoryId: item.categoryId,
          categoryName: category?.name || "Unknown",
          subcategoryId: item.subcategoryId,
          subcategoryName: subcategory?.name
        },
        relatedItems
      };
    } catch (error) {
      log.error(error, "Failed to get menu item", { itemId, restaurantId });
      throw error;
    }
  }

  async searchMenuItems(params: {
    restaurantId?: string;
    query?: string;
    categoryId?: string;
    subcategoryId?: string;
    vegOnly?: boolean;
    inStockOnly?: boolean;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    isRecommended?: boolean;
    limit?: number;
    skip?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<SearchMenuResponse> {
    try {
      const restaurantId = params.restaurantId || "default";
      const menuItemsCollection = await this.getMenuItemsCollection();

      // Build aggregation pipeline
      const pipeline: any[] = [];

      // Match stage
      const matchStage: any = {
        restaurantId,
        isActive: true
      };

      if (params.categoryId) matchStage.categoryId = params.categoryId;
      if (params.subcategoryId) matchStage.subcategoryId = params.subcategoryId;
      if (params.vegOnly !== undefined) matchStage.isVeg = params.vegOnly;
      if (params.inStockOnly !== undefined) matchStage.isInStock = params.inStockOnly;
      if (params.isRecommended !== undefined) matchStage.isRecommended = params.isRecommended;

      if (params.minPrice !== undefined || params.maxPrice !== undefined) {
        matchStage.basePrice = {};
        if (params.minPrice !== undefined) matchStage.basePrice.$gte = params.minPrice;
        if (params.maxPrice !== undefined) matchStage.basePrice.$lte = params.maxPrice;
      }

      if (params.query) {
        matchStage.$text = { $search: params.query };
      }

      if (params.tags && params.tags.length > 0) {
        matchStage.tags = { $in: params.tags };
      }

      pipeline.push({ $match: matchStage });

      // Add search score for text search
      if (params.query) {
        pipeline.push({
          $addFields: {
            searchScore: { $meta: "textScore" }
          }
        });
      }

      // Sort stage
      const sortStage: any = {};
      if (params.query) {
        sortStage.searchScore = { $meta: "textScore" };
      } else {
        const sortField = params.sortBy || 'displayOrder';
        const sortDirection = params.sortOrder === 'desc' ? -1 : 1;
        sortStage[sortField] = sortDirection;
      }
      pipeline.push({ $sort: sortStage });

      // Pagination
      if (params.skip) pipeline.push({ $skip: params.skip });
      if (params.limit) pipeline.push({ $limit: params.limit });

      // Execute search
      const items = await menuItemsCollection.aggregate(pipeline).toArray() as MenuItem[];

      // Get total count (without pagination)
      const totalResults = await menuItemsCollection.countDocuments(matchStage);

      return {
        items,
        totalResults,
        searchQuery: params.query || "",
        filtersApplied: {
          category: params.categoryId,
          vegOnly: params.vegOnly,
          maxPrice: params.maxPrice,
          minPrice: params.minPrice,
          inStockOnly: params.inStockOnly,
          tags: params.tags
        }
      };
    } catch (error) {
      log.error(error, "Failed to search menu items", { params });
      throw error;
    }
  }

  // ================== WRITE OPERATIONS ==================

  async createMenuItem(itemData: Omit<MenuItem, '_id' | 'createdAt' | 'updatedAt' | 'searchText'>): Promise<string> {
    try {
      const menuItemsCollection = await this.getMenuItemsCollection();

      const now = new Date();
      const slug = this.generateSlug(itemData.name);

      const newItem: MenuItem = {
        ...itemData,
        slug,
        searchText: `${itemData.name} ${itemData.description} ${itemData.tags.join(' ')}`.toLowerCase(),
        orderCount: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: now,
        updatedAt: now
      };

      const result = await menuItemsCollection.insertOne(newItem);

      // Update category item count
      await this.updateCategoryItemCount(itemData.categoryId, itemData.subcategoryId);

      // Invalidate menu view
      await this.invalidateMenuView(itemData.restaurantId);

      return result.insertedId.toString();
    } catch (error) {
      log.error(error, "Failed to create menu item", { itemData });
      throw error;
    }
  }

  async createCategory(categoryData: Omit<Category, '_id' | 'createdAt' | 'updatedAt' | 'itemCount'>): Promise<string> {
    try {
      const categoriesCollection = await this.getCategoriesCollection();

      const now = new Date();
      const slug = this.generateSlug(categoryData.name);

      const newCategory: Category = {
        ...categoryData,
        slug,
        itemCount: 0,
        createdAt: now,
        updatedAt: now
      };

      const result = await categoriesCollection.insertOne(newCategory);

      // Invalidate menu view
      await this.invalidateMenuView(categoryData.restaurantId);

      return result.insertedId.toString();
    } catch (error) {
      log.error(error, "Failed to create category", { categoryData });
      throw error;
    }
  }

  // ================== HELPER METHODS ==================

  private async getCategoryById(categoryId: string, restaurantId: string): Promise<Category | null> {
    const categoriesCollection = await this.getCategoriesCollection();
    return await categoriesCollection.findOne({
      _id: categoryId,
      restaurantId,
      isActive: true
    }) as Category;
  }

  private async getItemsByCategory(categoryId: string, restaurantId: string): Promise<MenuItem[]> {
    const menuItemsCollection = await this.getMenuItemsCollection();
    return await menuItemsCollection.find(
      { categoryId, restaurantId, isActive: true },
      { sort: { displayOrder: 1 } }
    ).toArray() as MenuItem[];
  }

  private async getRelatedItems(categoryId: string, excludeItemId: string, restaurantId: string, limit: number = 4): Promise<MenuItem[]> {
    const menuItemsCollection = await this.getMenuItemsCollection();
    return await menuItemsCollection.find(
      {
        categoryId,
        restaurantId,
        isActive: true,
        _id: { $ne: excludeItemId }
      },
      {
        sort: { isRecommended: -1, orderCount: -1 },
        limit
      }
    ).toArray() as MenuItem[];
  }

  private async updateCategoryItemCount(categoryId: string, subcategoryId?: string): Promise<void> {
    const menuItemsCollection = await this.getMenuItemsCollection();
    const categoriesCollection = await this.getCategoriesCollection();

    const categoryItemCount = await menuItemsCollection.countDocuments({
      categoryId,
      isActive: true
    });

    const updateData: any = {
      itemCount: categoryItemCount,
      updatedAt: new Date()
    };

    if (subcategoryId) {
      const subcategoryItemCount = await menuItemsCollection.countDocuments({
        categoryId,
        subcategoryId,
        isActive: true
      });

      updateData['subcategories.$.itemCount'] = subcategoryItemCount;
    }

    await categoriesCollection.updateOne(
      { _id: categoryId },
      { $set: updateData }
    );
  }

  private async invalidateMenuView(restaurantId: string): Promise<void> {
    const menuViewsCollection = await this.getMenuViewsCollection();
    await menuViewsCollection.updateOne(
      { restaurantId },
      { $set: { needsRefresh: true, lastUpdated: new Date() } }
    );
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ================== INDEX CREATION ==================

  async createIndexes(): Promise<void> {
    try {
      const menuItemsCollection = await this.getMenuItemsCollection();
      const categoriesCollection = await this.getCategoriesCollection();
      const menuViewsCollection = await this.getMenuViewsCollection();

      // Menu Items Indexes
      await Promise.all([
        menuItemsCollection.createIndex({ restaurantId: 1, isActive: 1, displayOrder: 1 }),
        menuItemsCollection.createIndex({ restaurantId: 1, categoryId: 1, isActive: 1 }),
        menuItemsCollection.createIndex({ restaurantId: 1, subcategoryId: 1, isActive: 1 }),
        menuItemsCollection.createIndex({ restaurantId: 1, isVeg: 1, isActive: 1 }),
        menuItemsCollection.createIndex({ restaurantId: 1, isInStock: 1, isActive: 1 }),
        menuItemsCollection.createIndex({ restaurantId: 1, isRecommended: 1, isActive: 1 }),
        menuItemsCollection.createIndex({ restaurantId: 1, basePrice: 1, isActive: 1 }),
        menuItemsCollection.createIndex({ restaurantId: 1, tags: 1, isActive: 1 }),
        menuItemsCollection.createIndex({ slug: 1 }, { unique: true }),
        menuItemsCollection.createIndex(
          { name: "text", description: "text", tags: "text" },
          { weights: { name: 10, description: 5, tags: 1 } }
        )
      ]);

      // Categories Indexes
      await Promise.all([
        categoriesCollection.createIndex({ restaurantId: 1, isActive: 1, displayOrder: 1 }),
        categoriesCollection.createIndex({ slug: 1 }, { unique: true })
      ]);

      // Menu Views Indexes
      await Promise.all([
        menuViewsCollection.createIndex({ restaurantId: 1, isActive: 1, version: -1 }),
        menuViewsCollection.createIndex({ restaurantId: 1 }, { unique: true })
      ]);

      log.info("All food menu indexes created successfully");
    } catch (error) {
      log.error(error, "Failed to create indexes");
      throw error;
    }
  }
}
