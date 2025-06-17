// Food Menu API Usage Examples
// This file demonstrates how to use the food menu API endpoints

/**
 * Example 1: Get Complete Menu
 *
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      http://localhost:4000/menu
 */

/**
 * Example 2: Get Menu Categories (for navigation)
 *
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      http://localhost:4000/menu/categories
 */

/**
 * Example 3: Get Specific Menu Item Details
 *
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      http://localhost:4000/menu/item/166389148
 */

/**
 * Example 4: Get All Items in a Category
 *
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      http://localhost:4000/menu/category/59696433
 */

/**
 * Example 5: Search Menu Items
 *
 * Basic text search:
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      "http://localhost:4000/menu/search?query=thali"
 *
 * Vegetarian items only:
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      "http://localhost:4000/menu/search?veg_only=true"
 *
 * Price range filter:
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      "http://localhost:4000/menu/search?min_price=100&max_price=300"
 *
 * Combined filters:
 * curl -H "Authorization: Bearer your-token" \
 *      -H "Content-Type: application/json" \
 *      "http://localhost:4000/menu/search?query=rice&veg_only=true&max_price=200&in_stock_only=true"
 */

// JavaScript/TypeScript Usage Examples

export async function menuUsageExamples(accessToken: string) {
  const baseUrl = 'http://localhost:4000';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Get complete menu
    console.log('🍽️  Fetching complete menu...');
    const menuResponse = await fetch(`${baseUrl}/menu`, { headers });
    const menu = await menuResponse.json();
    console.log(`Found ${menu.total_items} items in ${menu.total_categories} categories`);

    // 2. Get menu categories for navigation
    console.log('\n📋 Fetching menu categories...');
    const categoriesResponse = await fetch(`${baseUrl}/menu/categories`, { headers });
    const categories = await categoriesResponse.json();
    console.log('Available categories:');
    categories.categories.forEach((cat: any) =>
      console.log(`  - ${cat.name} (${cat.item_count} items)`)
    );

    // 3. Get details of the first item
    if (menu.categories.length > 0) {
      const firstCategory = menu.categories[0];
      const firstSubCategory = firstCategory.sub_categories_order[0];
      const firstItem = firstSubCategory.items_order[0];

      console.log(`\n🔍 Fetching details for: ${firstItem.name}`);
      const itemResponse = await fetch(`${baseUrl}/menu/item/${firstItem.id}`, { headers });
      const itemDetails = await itemResponse.json();
      console.log(`Price: ₹${itemDetails.item.price}`);
      console.log(`Type: ${itemDetails.item.is_veg}`);
      console.log(`Category: ${itemDetails.category_info.main_category_name}`);
    }

    // 4. Search for vegetarian items under ₹200
    console.log('\n🥗 Searching for vegetarian items under ₹200...');
    const searchResponse = await fetch(
      `${baseUrl}/menu/search?veg_only=true&max_price=200`,
      { headers }
    );
    const searchResults = await searchResponse.json();
    console.log(`Found ${searchResults.total_results} matching items:`);
    searchResults.items.slice(0, 5).forEach((item: any) =>
      console.log(`  - ${item.name} (₹${item.price})`)
    );

    // 5. Search for "rice" items
    console.log('\n🍚 Searching for rice items...');
    const riceResponse = await fetch(
      `${baseUrl}/menu/search?query=rice`,
      { headers }
    );
    const riceResults = await riceResponse.json();
    console.log(`Found ${riceResults.total_results} rice items:`);
    riceResults.items.slice(0, 3).forEach((item: any) =>
      console.log(`  - ${item.name} (₹${item.price})`)
    );

    // 6. Get all items in the first category
    if (menu.categories.length > 0) {
      const categoryId = menu.categories[0].id;
      console.log(`\n📂 Getting all items in category: ${menu.categories[0].name}`);
      const categoryResponse = await fetch(`${baseUrl}/menu/category/${categoryId}`, { headers });
      const categoryData = await categoryResponse.json();
      console.log(`Found ${categoryData.items.length} items in this category`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// How to get an access token first
export async function getAccessToken() {
  const loginResponse = await fetch('http://localhost:4000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'your-email@example.com',
      password: 'your-password'
    })
  });

  const loginData = await loginResponse.json();
  return loginData.accessToken;
}

// Complete example workflow
export async function completeExample() {
  console.log('🚀 Starting Food Menu API Demo...\n');

  // Step 1: Get access token
  console.log('🔐 Getting access token...');
  // const accessToken = await getAccessToken();

  // For demo purposes, use a placeholder token
  // In real usage, you would get this from the login endpoint
  const accessToken = 'your-actual-bearer-token-here';

  // Step 2: Use the menu API
  await menuUsageExamples(accessToken);

  console.log('\n✅ Demo completed!');
}
