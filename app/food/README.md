# Food Menu API

A comprehensive food menu API with authentication support, built with Encore.ts. This API serves a rich menu dataset with categories, items, variants, and search capabilities.

## Authentication

All endpoints require authentication using Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

You can obtain access tokens by using the authentication endpoints in the `auth` service.

## Endpoints

### 1. Get Complete Menu
**GET** `/menu`

Returns the complete menu structure with all categories and items.

**Response:**
```json
{
  "categories": [
    {
      "id": "59696433",
      "name": "Thali",
      "main_category_order": 100,
      "sub_categories_order": [
        {
          "id": "59696439",
          "name": "nota",
          "items_order": [
            {
              "id": "166389148",
              "name": "Deluxe Thali"
            }
          ]
        }
      ]
    }
  ],
  "total_items": 45,
  "total_categories": 5,
  "out_of_stock_categories": ["61091176"],
  "out_of_stock_sub_categories": ["61105055"]
}
```

### 2. Get Menu Categories
**GET** `/menu/categories`

Returns just the category information for navigation purposes.

**Response:**
```json
{
  "categories": [
    {
      "id": "59696433",
      "name": "Thali",
      "order": 100,
      "item_count": 12
    }
  ]
}
```

### 3. Get Menu Item Details
**GET** `/menu/item/:itemId`

Returns detailed information about a specific menu item.

**Parameters:**
- `itemId` (path parameter): The ID of the menu item

**Response:**
```json
{
  "item": {
    "id": "166389148",
    "uniqueId": "166389148",
    "name": "Deluxe Thali",
    "description": "Rice + 3 Choice of Bread + Dal /Rajma /Chole + Seasonal Sabji + Paneer Sabji + Salad + Gulab Jamun + Green Chutney + Salad",
    "category_id": "59696439",
    "is_veg": "VEG",
    "price": 249,
    "packing_charges": 9,
    "image_url": "https://media-assets.swiggy.com/swiggy/image/upload/...",
    "in_stock": 1,
    "enabled": 1,
    "variants": null,
    "addons": null,
    "recommended": false
  },
  "category_info": {
    "main_category_id": "59696433",
    "main_category_name": "Thali",
    "sub_category_id": "59696439",
    "sub_category_name": "nota"
  }
}
```

### 4. Get Menu Category
**GET** `/menu/category/:categoryId`

Returns all items in a specific category.

**Parameters:**
- `categoryId` (path parameter): The ID of the category

**Response:**
```json
{
  "category": {
    "id": "59696433",
    "name": "Thali",
    "main_category_order": 100,
    "sub_categories_order": [...]
  },
  "items": [
    {
      "id": "166389148",
      "name": "Deluxe Thali",
      "price": 249,
      "is_veg": "VEG",
      ...
    }
  ]
}
```

### 5. Search Menu Items
**GET** `/menu/search`

Search and filter menu items with various criteria.

**Query Parameters:**
- `query` (string): Search term for item names, descriptions, or categories
- `category` (string, optional): Filter by category ID or name
- `veg_only` (boolean, optional): Show only vegetarian items
- `max_price` (number, optional): Maximum price filter
- `min_price` (number, optional): Minimum price filter
- `in_stock_only` (boolean, optional): Show only items in stock

**Example:**
```
GET /menu/search?query=thali&veg_only=true&max_price=300
```

**Response:**
```json
{
  "items": [
    {
      "id": "166389148",
      "name": "Deluxe Thali",
      "price": 249,
      "is_veg": "VEG",
      ...
    }
  ],
  "total_results": 5,
  "search_query": "thali",
  "filters_applied": {
    "veg_only": true,
    "max_price": 300
  }
}
```

## Usage Examples

### JavaScript/TypeScript
```javascript
// Get complete menu
const response = await fetch('/menu', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const menu = await response.json();

// Search for vegetarian items under ₹200
const searchResponse = await fetch('/menu/search?veg_only=true&max_price=200', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const searchResults = await searchResponse.json();

// Get specific item details
const itemResponse = await fetch('/menu/item/166389148', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
const itemDetails = await itemResponse.json();
```

### cURL Examples
```bash
# Get complete menu
curl -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     http://localhost:4000/menu

# Search for items
curl -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     "http://localhost:4000/menu/search?query=rice&veg_only=true"

# Get category items
curl -H "Authorization: Bearer your-token" \
     -H "Content-Type: application/json" \
     http://localhost:4000/menu/category/59696433
```

## Data Structure

The menu contains several types of items:
- **Thali**: Complete meal sets with rice, bread, curries, and sides
- **Indian Bread**: Rotis, parathas, pooris, and bhature
- **Rice**: Various rice preparations
- **Accompaniments**: Salads, chutneys, and sides
- **Breakfast**: Morning meal options

### Item Properties
- `is_veg`: "VEG" for vegetarian items, "NON_VEG" for non-vegetarian
- `in_stock`: 1 for available, 0 for out of stock
- `enabled`: 1 for active items, 0 for disabled
- `price`: Item price in rupees
- `packing_charges`: Additional packaging charges
- `variants`: Item variations (size, preparation style)
- `addons`: Available add-ons for customization

## Error Handling

All endpoints return structured error responses:

```json
{
  "code": "not_found",
  "message": "Menu item with ID 123456 not found"
}
```

Common error codes:
- `unauthenticated`: Missing or invalid authentication
- `not_found`: Requested item/category not found
- `invalid_argument`: Invalid parameters provided

## Performance Notes

- The complete menu endpoint loads all data in memory for fast access
- Search operations are performed in-memory for optimal performance
- All endpoints include comprehensive logging for monitoring and debugging
- Response times are typically under 100ms for most operations 
