import products from './api/products.json';

const FREE_SHIPPING_THRESHOLD = 500;
const FLAT_RATE = 15;

// ===== CART STATE (localStorage) =====
function getCart() {
  return JSON.parse(localStorage.getItem('nurfia_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('nurfia_cart', JSON.stringify(cart));
}

// ===== ADD TO CART =====
export function addToCart(productId, quantity = 1) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  let cart = getCart();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.qty += quantity;
  } else {
    cart.push({ id: product.id, qty: quantity });
  }

  saveCart(cart);
  updateCartCount();
  renderDrawer();
  openDrawer();
}

// ===== REMOVE FROM CART =====
function removeFromCart(productId) {
  let cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  updateCartCount();
  renderDrawer();
  renderCartPage();
  updateTotals();
}

// ===== UPDATE QUANTITY =====
function updateQty(productId, newQty) {
  let cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (item) {
    item.qty = Math.max(1, newQty);
    saveCart(cart);
  }
  updateCartCount();
  renderDrawer();
  renderCartPage();
  updateTotals();
}

// ===== CLEAR CART =====
function clearCart() {
  saveCart([]);
  updateCartCount();
  renderDrawer();
  renderCartPage();
  updateTotals();
}

// ===== CALCULATE TOTALS =====
function getCartTotals() {
  const cart = getCart();
  let subtotal = 0;
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
      subtotal += (product.salePrice || product.price) * item.qty;
    }
  });
  return subtotal;
}

function getTotalItems() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

// ===== UPDATE CART COUNT BADGE =====
function updateCartCount() {
  const count = getTotalItems();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
  });
}

// ===== SHIPPING BAR =====
function updateShippingBar(subtotal) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  // Page bar
  const fill = document.getElementById('shippingFill');
  const text = document.getElementById('shippingBarText');
  if (fill) fill.style.width = percent + '%';
  if (text) {
    text.innerHTML = remaining > 0
      ? `Add <strong>$${remaining.toFixed(2)}</strong> to cart and get free shipping!`
      : `🎉 You have free shipping!`;
  }

  // Drawer bar
  const dFill = document.getElementById('drawerShipFill');
  const dText = document.getElementById('drawerShipText');
  if (dFill) dFill.style.width = percent + '%';
  if (dText) {
    dText.innerHTML = remaining > 0
      ? `Add <strong>$${remaining.toFixed(2)}</strong> to cart and get free shipping!`
      : `🎉 You have free shipping!`;
  }
}

// ===== RENDER CART PAGE =====
function renderCartPage() {
  const tbody = document.getElementById('cartTableBody');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartActions = document.getElementById('cartActions');
  const cartTotals = document.getElementById('cartTotals');
  if (!tbody) return; // Safely exits if we aren't on cart.html

  const cart = getCart();

  if (cart.length === 0) {
    tbody.innerHTML = '';
    if (cartEmpty) cartEmpty.style.display = 'flex';
    if (cartActions) cartActions.style.display = 'none';
    if (cartTotals) cartTotals.style.display = 'none';
    return;
  }

  if (cartEmpty) cartEmpty.style.display = 'none';
  if (cartActions) cartActions.style.display = 'flex';
  if (cartTotals) cartTotals.style.display = 'block';

  tbody.innerHTML = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    if (!p) return '';
    const price = p.salePrice || p.price;
    const subtotal = price * item.qty;
    const imgTag = p.video
      ? `<video src="${p.video}" autoplay muted loop playsinline class="cart-product-img"></video>`
      : `<img src="${p.image}" alt="${p.name}" class="cart-product-img" />`;

    return `
      <tr data-id="${p.id}">
        <td>
          <div class="cart-product-cell">
            ${imgTag}
            <div>
              <p class="cart-product-name">${p.name}</p>
              <p class="cart-product-meta">${p.subCategory}</p>
            </div>
          </div>
        </td>
        <td>$${price.toFixed(2)}</td>
        <td>
          <div class="qty-control">
            <button class="qty-btn qty-minus" data-id="${p.id}">−</button>
            <input type="number" class="qty-input" value="${item.qty}" min="1" data-id="${p.id}" />
            <button class="qty-btn qty-plus" data-id="${p.id}">+</button>
          </div>
        </td>
        <td><strong>$${subtotal.toFixed(2)}</strong></td>
        <td>
          <button class="cart-remove-btn" data-id="${p.id}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Re-attach Events safely
  tbody.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const cart = getCart();
      const item = cart.find(i => i.id === id);
      if (item) updateQty(id, item.qty - 1);
    });
  });
  tbody.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const cart = getCart();
      const item = cart.find(i => i.id === id);
      if (item) updateQty(id, item.qty + 1);
    });
  });
  tbody.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => {
      updateQty(parseInt(input.dataset.id), parseInt(input.value) || 1);
    });
  });
  tbody.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
  });
}

// ===== UPDATE TOTALS =====
function updateTotals() {
  const subtotal = getCartTotals();
  const shippingRadio = document.querySelector('input[name="shipping"]:checked');
  
  // Logic Fix: If subtotal qualifies for free shipping, shipping cost is 0
  let shipping = shippingRadio ? parseFloat(shippingRadio.value) : FLAT_RATE;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shipping = 0;
    // Visually update shipping radio status descriptions if elements exist
    const flatRateLabel = document.getElementById('flatRate');
    if (flatRateLabel) {
       const labelContainer = flatRateLabel.closest('.shipment-option');
       if (labelContainer) labelContainer.innerHTML = `<input type="radio" name="shipping" value="0" checked disabled /> Free Shipping applied`;
    }
  }

  const total = subtotal + shipping;

  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl    = document.getElementById('cartTotal');
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (totalEl)    totalEl.textContent    = `$${total.toFixed(2)}`;

  updateShippingBar(subtotal);
}

// ===== RENDER DRAWER =====
function renderDrawer() {
  const drawerItems  = document.getElementById('drawerItems');
  const drawerFooter = document.getElementById('drawerFooter');
  const drawerSub    = document.getElementById('drawerSubtotal');
  const shippingMsg  = document.getElementById('drawerShippingMsg');
  if (!drawerItems) return;

  const cart = getCart();
  const subtotal = getCartTotals();

  // Shipping msg logic execution
  if (shippingMsg) {
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
    shippingMsg.innerHTML = `
      <p id="drawerShipText">${remaining > 0
        ? `Add <strong>$${remaining.toFixed(2)}</strong> to cart and get free shipping!`
        : `🎉 You have free shipping!`}</p>
      <div class="drawer-ship-bar">
        <div class="drawer-ship-fill" id="drawerShipFill" style="width:${percent}%"></div>
      </div>
    `;
  }

  if (cart.length === 0) {
    drawerItems.innerHTML = `<div class="drawer-empty"><i class="fa-solid fa-bag-shopping"></i><p>Your cart is empty.</p></div>`;
    return;
  }

  if (drawerSub) drawerSub.textContent = `$${subtotal.toFixed(2)}`;

  drawerItems.innerHTML = cart.map(item => {
    const p = products.find(prod => prod.id === item.id);
    if (!p) return '';
    const price = p.salePrice || p.price;
    const imgTag = p.video
      ? `<video src="${p.video}" autoplay muted loop playsinline class="drawer-item-img"></video>`
      : `<img src="${p.image}" alt="${p.name}" class="drawer-item-img" />`;
    return `
      <div class="drawer-item" data-id="${p.id}">
        ${imgTag}
        <div class="drawer-item-info">
          <p class="drawer-item-name">${p.name}</p>
          <p class="drawer-item-price">$${price.toFixed(2)}</p>
          <p class="drawer-item-qty">Qty: ${item.qty}</p>
        </div>
        <button class="drawer-item-remove" data-id="${p.id}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }).join('');

  drawerItems.querySelectorAll('.drawer-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
  });
}

// ===== DRAWER OPEN/CLOSE =====
function openDrawer() {
  // On mobile, go straight to cart page
  if (window.innerWidth <= 768) {
    window.location.href = 'cart.html';
    return;
  }
  
  document.getElementById('cartDrawer')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('active');
  document.body.classList.add('drawer-open');
}

function closeDrawer() {
  document.getElementById('cartDrawer')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('active');
  document.body.classList.remove('drawer-open');  // ✅ clean removal
}

// ===== GLOBAL EVENTS =====
document.getElementById('drawerClose')?.addEventListener('click', closeDrawer);
document.getElementById('cartOverlay')?.addEventListener('click', closeDrawer);
document.getElementById('cartIconBtn')?.addEventListener('click', () => {
  renderDrawer();
  openDrawer();
});

// Guard conditional blocks for page-specific event targets
const clearCartBtn = document.getElementById('clearCartBtn');
if (clearCartBtn) {
  clearCartBtn.addEventListener('click', () => {
    if (confirm('Clear all items from cart?')) clearCart();
  });
}

const applyCouponBtn = document.getElementById('applyCoupon');
if (applyCouponBtn) {
  applyCouponBtn.addEventListener('click', () => {
    const code = document.getElementById('couponInput')?.value.trim().toUpperCase();
    if (code === 'NURFIA10') {
      alert('Coupon applied! 10% discount added.');
    } else {
      alert('Invalid coupon code.');
    }
  });
}

// Shipping radios interaction check
const shippingRadios = document.querySelectorAll('input[name="shipping"]');
if (shippingRadios.length > 0) {
  shippingRadios.forEach(radio => {
    radio.addEventListener('change', updateTotals);
  });
}

// ===== INIT =====
updateCartCount();
renderCartPage();
renderDrawer();
updateTotals();

// ===== EXPORT =====
window.addToCart = addToCart;