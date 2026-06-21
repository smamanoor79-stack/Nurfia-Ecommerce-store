import { getAllProducts, addToBackendCart, removeFromBackendCart, clearBackendCart, getBackendCart, getToken, isLoggedIn, getImageUrl } from './api.js';

const FREE_SHIPPING_THRESHOLD = 500;
const FLAT_RATE = 15;

let products = [];
let cartItems = [];

async function loadProducts() {
  if (products.length === 0) products = await getAllProducts();
  return products;
}

// ===== LOCAL CART HELPERS =====
function getLocalCart() {
  return JSON.parse(localStorage.getItem('nurfia_cart') || '[]');
}
function saveLocalCart(cart) {
  localStorage.setItem('nurfia_cart', JSON.stringify(cart));
}

// ===== LOAD CART =====
async function loadCart() {
  if (isLoggedIn()) {
    try {
      const data = await getBackendCart();
      cartItems = (data.cartItems || []).map(item => ({
        id: item.product?._id || item.product,
        qty: item.quantity,
        name: item.name,
        image: item.image,
        price: item.price
      }));
      saveLocalCart(cartItems);
    } catch {
      cartItems = getLocalCart();
    }
  } else {
    cartItems = getLocalCart();
  }
}

// ===== SYNC localStorage TO BACKEND after login =====
export async function syncCartToBackend() {
  const localCart = getLocalCart();
  if (!isLoggedIn() || localCart.length === 0) return;

  await loadProducts();
  try {
    for (const item of localCart) {
      const product = products.find(p => p._id === item.id);
      if (!product) continue;
      await addToBackendCart(
        item.id,
        product.name,
        product.image,
        product.salePrice || product.price,
        item.qty
      );
    }

    saveLocalCart([]);

    const data = await getBackendCart();
    cartItems = (data.cartItems || []).map(item => ({
      id: item.product?._id || item.product,
      qty: item.quantity,
      name: item.name,
      image: item.image,
      price: item.price
    }));
    saveLocalCart(cartItems);
    updateCartCount();
    renderDrawer();
  } catch (err) {
    console.error('Cart sync error:', err);
  }
}

// ===== ADD TO CART =====
export async function addToCart(productId, quantity = 1) {
  await loadProducts();
  const product = products.find(p => p._id === productId);
  if (!product) return;

  let local = getLocalCart();
  const existing = local.find(item => item.id === productId);
  if (existing) {
    existing.qty += quantity;
  } else {
    local.push({
      id: productId,
      qty: quantity,
      name: product.name,
      image: product.image,
      price: product.salePrice || product.price
    });
  }
  saveLocalCart(local);
  cartItems = local;

  if (isLoggedIn()) {
    try {
      await addToBackendCart(
        productId,
        product.name,
        product.image,
        product.salePrice || product.price,
        quantity
      );

      const data = await getBackendCart();
      cartItems = (data.cartItems || []).map(item => ({
        id: item.product?._id || item.product,
        qty: item.quantity,
        name: item.name,
        image: item.image,
        price: item.price
      }));
      saveLocalCart(cartItems);
    } catch (err) {
      console.error('Backend cart sync error:', err);
    }
  }

  updateCartCount();
  renderDrawer();
  openDrawer();
}

// ===== REMOVE FROM CART =====
async function removeFromCart(productId) {
  let local = getLocalCart().filter(item => item.id !== productId);
  saveLocalCart(local);
  cartItems = local;

  if (isLoggedIn()) {
    removeFromBackendCart(productId).catch(err => console.error(err));
  }

  updateCartCount();
  renderDrawer();
  renderCartPage();
  updateTotals();
}

// ===== UPDATE QUANTITY =====
async function updateQty(productId, newQty) {
  if (newQty < 1) return;

  let local = getLocalCart();
  const item = local.find(i => i.id === productId);
  if (item) {
    item.qty = newQty;
    saveLocalCart(local);
    cartItems = local;
  }

  if (isLoggedIn()) {
    try {
      await removeFromBackendCart(productId);
      const product = products.find(p => p._id === productId);
      if (product) {
        await addToBackendCart(
          productId,
          product.name,
          product.image,
          product.salePrice || product.price,
          newQty
        );
      }
    } catch (err) {
      console.error('Update qty error:', err);
    }
  }

  updateCartCount();
  renderDrawer();
  renderCartPage();
  updateTotals();
}

// ===== CLEAR CART =====
async function clearCart() {
  saveLocalCart([]);
  cartItems = [];

  if (isLoggedIn()) {
    clearBackendCart().catch(err => console.error(err));
  }

  updateCartCount();
  renderDrawer();
  renderCartPage();
  updateTotals();
}

// ===== TOTALS =====
function getCartTotals() {
  return cartItems.reduce((sum, item) => {
    const price = item.price || 0;
    return sum + price * (item.qty || 1);
  }, 0);
}

function getTotalItems() {
  return cartItems.reduce((sum, item) => sum + (item.qty || 1), 0);
}

function updateCartCount() {
  const count = getTotalItems();
  document.querySelectorAll('.cart-count:not(.wishlist-count)').forEach(el => {
    el.textContent = count;
  });
}

// ===== SHIPPING BAR =====
function updateShippingBar(subtotal) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const fill = document.getElementById('shippingFill');
  const text = document.getElementById('shippingBarText');
  if (fill) fill.style.width = percent + '%';
  if (text) {
    text.innerHTML = remaining > 0
      ? `Add <strong>$${remaining.toFixed(2)}</strong> to cart and get free shipping!`
      : `🎉 You have free shipping!`;
  }

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
  if (!tbody) return;

  if (cartItems.length === 0) {
    tbody.innerHTML = '';
    if (cartEmpty) cartEmpty.style.display = 'flex';
    if (cartActions) cartActions.style.display = 'none';
    if (cartTotals) cartTotals.style.display = 'none';
    return;
  }

  if (cartEmpty) cartEmpty.style.display = 'none';
  if (cartActions) cartActions.style.display = 'flex';
  if (cartTotals) cartTotals.style.display = 'block';

  tbody.innerHTML = cartItems.map(item => {
    const p = products.find(prod => prod._id === item.id);
    const name = item.name || p?.name || '';
    const price = item.price || 0;
    const qty = item.qty || 1;
    const image = getImageUrl(item.image || p?.image || '');
    const subtotal = price * qty;

    const imgTag = image.endsWith('.mp4')
      ? `<video src="${image}" autoplay muted loop playsinline class="cart-product-img"></video>`
      : `<img src="${image}" alt="${name}" class="cart-product-img" />`;

    return `
      <tr data-id="${item.id}">
        <td>
          <div class="cart-product-cell">
            ${imgTag}
            <div>
              <p class="cart-product-name">${name}</p>
              <p class="cart-product-meta">${p?.subCategory || ''}</p>
            </div>
          </div>
        </td>
        <td>$${price.toFixed(2)}</td>
        <td>
          <div class="qty-control">
            <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
            <input type="number" class="qty-input" value="${qty}" min="1" data-id="${item.id}" />
            <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
          </div>
        </td>
        <td><strong>$${subtotal.toFixed(2)}</strong></td>
        <td>
          <button class="cart-remove-btn" data-id="${item.id}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = cartItems.find(i => i.id === btn.dataset.id);
      if (item) updateQty(btn.dataset.id, (item.qty || 1) - 1);
    });
  });
  tbody.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = cartItems.find(i => i.id === btn.dataset.id);
      if (item) updateQty(btn.dataset.id, (item.qty || 1) + 1);
    });
  });
  tbody.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => {
      updateQty(input.dataset.id, parseInt(input.value) || 1);
    });
  });
  tbody.querySelectorAll('.cart-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
  });
}

// ===== UPDATE TOTALS =====
function updateTotals() {
  const subtotal = getCartTotals();
  const shippingRadio = document.querySelector('input[name="shipping"]:checked');
  let shipping = shippingRadio ? parseFloat(shippingRadio.value) : FLAT_RATE;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) shipping = 0;

  const total = subtotal + shipping;
  const subtotalEl = document.getElementById('cartSubtotal');
  const totalEl = document.getElementById('cartTotal');
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

  updateShippingBar(subtotal);
}

// ===== RENDER DRAWER =====
function renderDrawer() {
  const drawerItems = document.getElementById('drawerItems');
  const drawerSub = document.getElementById('drawerSubtotal');
  const shippingMsg = document.getElementById('drawerShippingMsg');
  if (!drawerItems) return;

  const subtotal = getCartTotals();

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

  if (cartItems.length === 0) {
    drawerItems.innerHTML = `<div class="drawer-empty"><i class="fa-solid fa-bag-shopping"></i><p>Your cart is empty.</p></div>`;
    if (drawerSub) drawerSub.textContent = '$0.00';
    return;
  }

  if (drawerSub) drawerSub.textContent = `$${subtotal.toFixed(2)}`;

  drawerItems.innerHTML = cartItems.map(item => {
    const name = item.name || '';
    const price = item.price || 0;
    const qty = item.qty || 1;
    const image = getImageUrl(item.image || '');

    const imgTag = image.endsWith('.mp4')
      ? `<video src="${image}" autoplay muted loop playsinline class="drawer-item-img"></video>`
      : `<img src="${image}" alt="${name}" class="drawer-item-img" />`;

    return `
      <div class="drawer-item" data-id="${item.id}">
        ${imgTag}
        <div class="drawer-item-info">
          <p class="drawer-item-name">${name}</p>
          <p class="drawer-item-price">$${price.toFixed(2)}</p>
          <p class="drawer-item-qty">Qty: ${qty}</p>
        </div>
        <button class="drawer-item-remove" data-id="${item.id}">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
  }).join('');

  drawerItems.querySelectorAll('.drawer-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
  });
}

// ===== DRAWER OPEN/CLOSE =====
function openDrawer() {
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
  document.body.classList.remove('drawer-open');
}

document.getElementById('drawerClose')?.addEventListener('click', closeDrawer);
document.getElementById('cartOverlay')?.addEventListener('click', closeDrawer);
document.getElementById('cartIconBtn')?.addEventListener('click', () => {
  renderDrawer();
  openDrawer();
});

document.getElementById('clearCartBtn')?.addEventListener('click', () => {
  if (confirm('Clear all items from cart?')) clearCart();
});

document.getElementById('applyCoupon')?.addEventListener('click', () => {
  const code = document.getElementById('couponInput')?.value.trim().toUpperCase();
  if (code === 'NURFIA10') alert('Coupon applied! 10% discount added.');
  else alert('Invalid coupon code.');
});

document.querySelectorAll('input[name="shipping"]').forEach(radio => {
  radio.addEventListener('change', updateTotals);
});

// ===== INIT =====
async function init() {
  await loadProducts();
  await loadCart();
  updateCartCount();
  renderCartPage();
  renderDrawer();
  updateTotals();
}

init();

window.addToCart = addToCart;