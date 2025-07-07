import { Injectable, computed, signal } from '@angular/core';

export interface FoodItem {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class FoodCartService {
  private _items = signal<FoodItem[]>([
    {
      id: '1',
      name: 'Honey Whole Chicken',
      image: 'assets/images/chicken.png',
      price: 9.00,
      originalPrice: 11.00,
      quantity: 0
    },
    {
      id: '2',
      name: 'Classic Egg Toast',
      image: 'assets/images/toast.png',
      price: 3.00,
      originalPrice: 5.00,
      quantity: 0
    },
    {
      id: '3',
      name: 'Sweet Fruity Pie',
      image: 'assets/images/pie.png',
      price: 7.00,
      originalPrice: 9.00,
      quantity: 0
    },
    {
      id: '4',
      name: 'Mixed Berries Pancake',
      image: 'assets/images/pancake.png',
      price: 5.00,
      originalPrice: 7.00,
      quantity: 0
    },
    {
      id: '5',
      name: 'Chicken Hamburger',
      image: 'assets/images/burger.png',
      price: 8.00,
      originalPrice: 10.00,
      quantity: 0
    },
    {
      id: '6',
      name: 'Choco Crunchy Donut',
      image: 'assets/images/donut.png',
      price: 2.00,
      originalPrice: 4.00,
      quantity: 0
    }
  ]);

  items = computed(() => this._items());

  private _cart = signal<FoodItem[]>([]);
  cart = computed(() => this._cart());

  cartCount = computed(() => this._cart().reduce((total, item) => total + item.quantity, 0));

  // Public signals for components to consume
  readonly cartItems = this._cart.asReadonly();

  // Computed values
  readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0)
  );

  readonly discount = computed(() => this.subtotal() * 0.1); // 10% discount
  readonly total = computed(() => this.subtotal() - this.discount());

  updateQuantity(id: string, quantity: number, itemData?: Partial<FoodItem>) {
    // If itemData is provided, use it for new items
    if (itemData && quantity > 0) {
      const cartItems = this._cart();
      const cartItemIndex = cartItems.findIndex(item => item.id === id);

      const cartItem: FoodItem = {
        id: id,
        name: itemData.name || '',
        image: itemData.image || '',
        price: itemData.price || 0,
        originalPrice: itemData.originalPrice || itemData.price || 0,
        quantity: quantity
      };

      if (cartItemIndex === -1) {
        this._cart.set([...cartItems, cartItem]);
      } else {
        const updatedCart = [...cartItems];
        updatedCart[cartItemIndex] = cartItem;
        this._cart.set(updatedCart);
      }
    } else if (quantity === 0) {
      // Remove from cart
      this._cart.set(this._cart().filter(item => item.id !== id));
    }

    // Legacy support for existing items
    const items = this._items();
    const itemIndex = items.findIndex(item => item.id === id);

    if (itemIndex !== -1) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity
      };
      this._items.set(updatedItems);
    }
  }

  clearCart() {
    this._cart.set([]);
    this._items.update(items =>
      items.map(item => ({ ...item, quantity: 0 }))
    );
  }

  checkout() {
    // Implement checkout logic here
    console.log('Checking out with items:', this.cartItems());
    this.clearCart();
  }
}
