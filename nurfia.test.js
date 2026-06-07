import { describe, it, expect, beforeEach, afterEach } from 'vitest';

/**
 * NURFIA E-COMMERCE TEST SUITE
 * Comprehensive tests for cart, wishlist, and product logic
 * Run with: npm test
 */

// ============================================================
// MOCK DATA
// ============================================================

const mockProducts = [
  { id: 1, name: 'Classic Shirt', price: 50, salePrice: 40, subCategory: 'Men', image: 'shirt.jpg', category: 'clothing' },
  { id: 2, name: 'Blue Jeans', price: 80, salePrice: null, subCategory: 'Men', image: 'jeans.jpg', category: 'pants' },
  { id: 3, name: 'Summer Dress', price: 120, salePrice: 90, subCategory: 'Women', image: 'dress.jpg', category: 'clothing' },
  { id: 4, name: 'Jacket', price: 200, salePrice: 150, subCategory: 'Unisex', image: 'jacket.jpg', category: 'outerwear' },
];

const FREE_SHIPPING_THRESHOLD = 500;
const FLAT_RATE = 15;

// ============================================================
// HELPER FUNCTIONS (Cart Logic)
// ============================================================

function getCart() {
  return JSON.parse(localStorage.getItem('nurfia_cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('nurfia_cart', JSON.stringify(cart));
}

function clearCartStorage() {
  localStorage.removeItem('nurfia_cart');
}

function addToCartLogic(productId, quantity = 1) {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) return false;

  let cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.qty += quantity;
  } else {
    cart.push({ id: product.id, qty: quantity });
  }

  saveCart(cart);
  return true;
}

function removeFromCartLogic(productId) {
  let cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
}

function updateQtyLogic(productId, newQty) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = Math.max(1, newQty);
    saveCart(cart);
    return true;
  }
  return false;
}

function clearCartLogic() {
  clearCartStorage();
}

function getCartTotals() {
  const cart = getCart();
  let subtotal = 0;
  cart.forEach(item => {
    const product = mockProducts.find(p => p.id === item.id);
    if (product) {
      subtotal += (product.salePrice || product.price) * item.qty;
    }
  });
  return subtotal;
}

function getTotalItems() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function calculateShipping(subtotal) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_RATE;
}

function calculateTotal(subtotal, shipping) {
  return subtotal + shipping;
}

// ============================================================
// HELPER FUNCTIONS (Wishlist Logic)
// ============================================================

function getWishlist() {
  return JSON.parse(localStorage.getItem('nurfia_wishlist') || '[]');
}

function saveWishlist(wishlist) {
  localStorage.setItem('nurfia_wishlist', JSON.stringify(wishlist));
}

function addToWishlistLogic(productId) {
  const product = mockProducts.find(p => p.id === productId);
  if (!product) return false;

  let wishlist = getWishlist();
  const exists = wishlist.find(item => item.id === productId);

  if (!exists) {
    wishlist.push({ id: product.id, name: product.name, price: product.price });
  }

  saveWishlist(wishlist);
  return !exists;
}

function removeFromWishlistLogic(productId) {
  let wishlist = getWishlist().filter(item => item.id !== productId);
  saveWishlist(wishlist);
}

function isInWishlistLogic(productId) {
  return getWishlist().some(item => item.id === productId);
}

function getWishlistCount() {
  return getWishlist().length;
}

// ============================================================
// HELPER FUNCTIONS (Product Filtering)
// ============================================================

function filterProductsByCategory(category) {
  return mockProducts.filter(p => p.category === category);
}

function filterProductsByPrice(minPrice, maxPrice) {
  return mockProducts.filter(p => {
    const price = p.salePrice || p.price;
    return price >= minPrice && price <= maxPrice;
  });
}

function searchProducts(query) {
  return mockProducts.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.subCategory.toLowerCase().includes(query.toLowerCase())
  );
}

function getSaleProducts() {
  return mockProducts.filter(p => p.salePrice && p.salePrice < p.price);
}

function calculateDiscount(originalPrice, salePrice) {
  if (!salePrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

// ============================================================
// TEST SUITE BEGINS
// ============================================================

describe('🛍️ NURFIA E-COMMERCE TEST SUITE', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ============================================================
  // CART TESTS
  // ============================================================

  describe('🛒 CART FUNCTIONALITY', () => {

    describe('Add to Cart', () => {
      it('should add a new product to empty cart', () => {
        addToCartLogic(1, 1);
        const cart = getCart();
        expect(cart).toHaveLength(1);
        expect(cart[0].id).toBe(1);
        expect(cart[0].qty).toBe(1);
      });

      it('should add multiple products with correct quantities', () => {
        addToCartLogic(1, 2);
        addToCartLogic(2, 3);
        const cart = getCart();
        expect(cart).toHaveLength(2);
        expect(cart[0]).toEqual({ id: 1, qty: 2 });
        expect(cart[1]).toEqual({ id: 2, qty: 3 });
      });

      it('should increment quantity if product already exists', () => {
        addToCartLogic(1, 1);
        addToCartLogic(1, 2);
        const cart = getCart();
        expect(cart).toHaveLength(1);
        expect(cart[0].qty).toBe(3);
      });

      it('should return false for invalid product ID', () => {
        const result = addToCartLogic(999, 1);
        expect(result).toBe(false);
        expect(getCart()).toHaveLength(0);
      });

      it('should persist data to localStorage', () => {
        addToCartLogic(1, 1);
        const stored = JSON.parse(localStorage.getItem('nurfia_cart'));
        expect(stored).toBeDefined();
        expect(stored[0].id).toBe(1);
      });
    });

    describe('Remove from Cart', () => {
      it('should remove a product from cart', () => {
        addToCartLogic(1, 1);
        addToCartLogic(2, 1);
        removeFromCartLogic(1);
        const cart = getCart();
        expect(cart).toHaveLength(1);
        expect(cart[0].id).toBe(2);
      });

      it('should handle removing from single-item cart', () => {
        addToCartLogic(1, 1);
        removeFromCartLogic(1);
        const cart = getCart();
        expect(cart).toHaveLength(0);
      });

      it('should not throw error when removing non-existent product', () => {
        addToCartLogic(1, 1);
        expect(() => removeFromCartLogic(999)).not.toThrow();
      });
    });

    describe('Update Quantity', () => {
      it('should update quantity for existing product', () => {
        addToCartLogic(1, 2);
        updateQtyLogic(1, 5);
        const cart = getCart();
        expect(cart[0].qty).toBe(5);
      });

      it('should enforce minimum quantity of 1', () => {
        addToCartLogic(1, 2);
        updateQtyLogic(1, 0);
        const cart = getCart();
        expect(cart[0].qty).toBe(1);
      });

      it('should handle negative quantity by setting to 1', () => {
        addToCartLogic(1, 3);
        updateQtyLogic(1, -5);
        const cart = getCart();
        expect(cart[0].qty).toBe(1);
      });

      it('should return false for non-existent product', () => {
        addToCartLogic(1, 1);
        const result = updateQtyLogic(999, 5);
        expect(result).toBe(false);
      });
    });

    describe('Clear Cart', () => {
      it('should clear all items from cart', () => {
        addToCartLogic(1, 1);
        addToCartLogic(2, 1);
        clearCartLogic();
        expect(getCart()).toHaveLength(0);
      });
    });

    describe('Cart Totals', () => {
      it('should calculate correct subtotal with sale prices', () => {
        addToCartLogic(1, 2); // $40 * 2 = $80
        addToCartLogic(3, 1); // $90 * 1 = $90
        const total = getCartTotals();
        expect(total).toBe(170);
      });

      it('should use regular price if sale price is null', () => {
        addToCartLogic(2, 1); // $80 (no sale price)
        const total = getCartTotals();
        expect(total).toBe(80);
      });

      it('should return 0 for empty cart', () => {
        const total = getCartTotals();
        expect(total).toBe(0);
      });

      it('should calculate correct total with multiple quantities', () => {
        addToCartLogic(1, 3); // $40 * 3 = $120
        addToCartLogic(2, 2); // $80 * 2 = $160
        const total = getCartTotals();
        expect(total).toBe(280);
      });
    });

    describe('Total Items Count', () => {
      it('should return correct count for single item', () => {
        addToCartLogic(1, 5);
        expect(getTotalItems()).toBe(5);
      });

      it('should sum quantities across multiple products', () => {
        addToCartLogic(1, 2);
        addToCartLogic(2, 3);
        addToCartLogic(3, 1);
        expect(getTotalItems()).toBe(6);
      });

      it('should return 0 for empty cart', () => {
        expect(getTotalItems()).toBe(0);
      });
    });

    describe('Shipping Calculation', () => {
      it('should apply flat rate for subtotal below threshold', () => {
        const shipping = calculateShipping(300);
        expect(shipping).toBe(FLAT_RATE);
      });

      it('should apply free shipping at threshold', () => {
        const shipping = calculateShipping(FREE_SHIPPING_THRESHOLD);
        expect(shipping).toBe(0);
      });

      it('should apply free shipping above threshold', () => {
        const shipping = calculateShipping(FREE_SHIPPING_THRESHOLD + 100);
        expect(shipping).toBe(0);
      });
    });

    describe('Total with Shipping', () => {
      it('should calculate correct total with flat rate shipping', () => {
        const total = calculateTotal(100, FLAT_RATE);
        expect(total).toBe(115);
      });

      it('should calculate correct total with free shipping', () => {
        const total = calculateTotal(500, 0);
        expect(total).toBe(500);
      });
    });
  });

  // ============================================================
  // WISHLIST TESTS
  // ============================================================

  describe('❤️ WISHLIST FUNCTIONALITY', () => {

    describe('Add to Wishlist', () => {
      it('should add a new product to empty wishlist', () => {
        addToWishlistLogic(1);
        const wishlist = getWishlist();
        expect(wishlist).toHaveLength(1);
        expect(wishlist[0].id).toBe(1);
      });

      it('should not add duplicate products to wishlist', () => {
        addToWishlistLogic(1);
        addToWishlistLogic(1);
        const wishlist = getWishlist();
        expect(wishlist).toHaveLength(1);
      });

      it('should add multiple different products', () => {
        addToWishlistLogic(1);
        addToWishlistLogic(2);
        addToWishlistLogic(3);
        const wishlist = getWishlist();
        expect(wishlist).toHaveLength(3);
      });

      it('should return true when adding new item', () => {
        const result = addToWishlistLogic(1);
        expect(result).toBe(true);
      });

      it('should return false when adding existing item', () => {
        addToWishlistLogic(1);
        const result = addToWishlistLogic(1);
        expect(result).toBe(false);
      });
    });

    describe('Remove from Wishlist', () => {
      it('should remove a product from wishlist', () => {
        addToWishlistLogic(1);
        addToWishlistLogic(2);
        removeFromWishlistLogic(1);
        const wishlist = getWishlist();
        expect(wishlist).toHaveLength(1);
        expect(wishlist[0].id).toBe(2);
      });

      it('should handle removing from single-item wishlist', () => {
        addToWishlistLogic(1);
        removeFromWishlistLogic(1);
        expect(getWishlist()).toHaveLength(0);
      });
    });

    describe('Check Wishlist Status', () => {
      it('should return true if product is in wishlist', () => {
        addToWishlistLogic(1);
        expect(isInWishlistLogic(1)).toBe(true);
      });

      it('should return false if product is not in wishlist', () => {
        expect(isInWishlistLogic(1)).toBe(false);
      });
    });

    describe('Wishlist Count', () => {
      it('should return correct count for empty wishlist', () => {
        expect(getWishlistCount()).toBe(0);
      });

      it('should return correct count after adding items', () => {
        addToWishlistLogic(1);
        expect(getWishlistCount()).toBe(1);
        addToWishlistLogic(2);
        expect(getWishlistCount()).toBe(2);
      });
    });
  });

  // ============================================================
  // PRODUCT FILTERING TESTS
  // ============================================================

  describe('🔍 PRODUCT FILTERING & SEARCH', () => {

    describe('Filter by Category', () => {
      it('should filter products by category', () => {
        const clothing = filterProductsByCategory('clothing');
        expect(clothing).toHaveLength(2);
        expect(clothing.every(p => p.category === 'clothing')).toBe(true);
      });

      it('should return empty array for non-existent category', () => {
        const result = filterProductsByCategory('nonexistent');
        expect(result).toHaveLength(0);
      });
    });

    describe('Filter by Price Range', () => {
      it('should filter products within price range', () => {
        const result = filterProductsByPrice(40, 100);
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(p => {
          const price = p.salePrice || p.price;
          return price >= 40 && price <= 100;
        })).toBe(true);
      });

      it('should return empty array if no products in range', () => {
        const result = filterProductsByPrice(1000, 2000);
        expect(result).toHaveLength(0);
      });
    });

    describe('Search Products', () => {
      it('should find products by name', () => {
        const result = searchProducts('Shirt');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(1);
      });

      it('should search case-insensitively', () => {
        const result = searchProducts('shirt');
        expect(result).toHaveLength(1);
      });

      it('should return empty array for no matches', () => {
        const result = searchProducts('Nonexistent');
        expect(result).toHaveLength(0);
      });
    });

    describe('Sale Products', () => {
      it('should return only products on sale', () => {
        const result = getSaleProducts();
        expect(result.every(p => p.salePrice && p.salePrice < p.price)).toBe(true);
      });

      it('should exclude products without sale price', () => {
        const result = getSaleProducts();
        expect(result.some(p => p.id === 2)).toBe(false);
      });
    });

    describe('Calculate Discount', () => {
      it('should calculate correct discount percentage', () => {
        const discount = calculateDiscount(100, 50);
        expect(discount).toBe(50);
      });

      it('should return 0 for no sale price', () => {
        const discount = calculateDiscount(80, null);
        expect(discount).toBe(0);
      });
    });
  });

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe('🔗 INTEGRATION SCENARIOS', () => {

    it('should handle complete checkout flow', () => {
      addToCartLogic(1, 2);
      addToCartLogic(3, 1);
      expect(getTotalItems()).toBe(3);
      expect(getCartTotals()).toBe(170);

      updateQtyLogic(1, 1);
      expect(getCartTotals()).toBe(130);

      removeFromCartLogic(3);
      expect(getTotalItems()).toBe(1);
    });

    it('should handle free shipping after reaching threshold', () => {
      addToCartLogic(1, 1);
      expect(calculateShipping(getCartTotals())).toBe(FLAT_RATE);

      addToCartLogic(2, 6);
      expect(calculateShipping(getCartTotals())).toBe(0);
    });

    it('should maintain wishlist separate from cart', () => {
      addToCartLogic(1, 1);
      addToWishlistLogic(2);
      expect(getTotalItems()).toBe(1);
      expect(getWishlistCount()).toBe(1);
    });

    it('should handle wishlist to cart conversion', () => {
      addToWishlistLogic(1);
      addToWishlistLogic(2);
      expect(getWishlistCount()).toBe(2);

      const wishlist = getWishlist();
      wishlist.forEach(item => {
        addToCartLogic(item.id, 1);
        removeFromWishlistLogic(item.id);
      });

      expect(getWishlistCount()).toBe(0);
      expect(getTotalItems()).toBe(2);
    });
  });

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe('⚠️ EDGE CASES', () => {

    it('should handle very large quantities', () => {
      addToCartLogic(1, 999999);
      expect(getTotalItems()).toBe(999999);
    });

    it('should handle many products in cart', () => {
      mockProducts.forEach(p => {
        addToCartLogic(p.id, 1);
      });
      expect(getCart()).toHaveLength(mockProducts.length);
    });

    it('should handle concurrent add operations', () => {
      addToCartLogic(1, 1);
      addToCartLogic(1, 1);
      addToCartLogic(1, 1);
      const cart = getCart();
      expect(cart[0].qty).toBe(3);
    });

    it('should handle empty cart calculations safely', () => {
      expect(() => {
        getCartTotals();
        getTotalItems();
        calculateShipping(getCartTotals());
      }).not.toThrow();
    });
  });
});
