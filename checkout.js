import { getAllProducts, getToken, getUser, isLoggedIn, getBackendCart, clearBackendCart, addToBackendWishlist, removeFromBackendWishlist, getBackendWishlist, BASE_URL } from './api.js';
const FREE_SHIPPING_THRESHOLD = 500;
let discountPercent = 0;
let products = [];
let cartItems = []; // backend cart items

// ===== CART FETCH =====
async function getCart() {
  if (!isLoggedIn()) return [];
  try {
    const data = await getBackendCart();
    return data.cartItems || [];
  } catch {
    return [];
  }
}

// ===== INIT =====
async function init() {
  if (!isLoggedIn()) {
    // Modal open karo
    document.getElementById('authModal')?.classList.add('active');
    document.getElementById('authModalOverlay')?.classList.add('active');

    // Sirf form sections blur karo — poora checkout-page nahi
    const elementsToBlur = [
      document.querySelector('.checkout-layout'),
      document.querySelector('.checkout-notice'),
      document.querySelector('.checkout-coupon-bar'),
      document.querySelector('.checkout-shipping-bar'),
    ];

    elementsToBlur.forEach(el => {
      if (el) {
        el.style.opacity = '0.4';
        el.style.filter = 'blur(3px)';
        el.style.pointerEvents = 'none';
        el.style.transition = 'filter 0.3s ease, opacity 0.3s ease';
      }
    });

    // Auth modal aur overlay ko blur se bahar rakho
    const authModal = document.getElementById('authModal');
    const authOverlay = document.getElementById('authModalOverlay');
    if (authModal) {
      authModal.style.filter = 'none';
      authModal.style.opacity = '1';
      authModal.style.pointerEvents = 'auto';
    }
    if (authOverlay) {
      authOverlay.style.filter = 'none';
      authOverlay.style.opacity = '1';
    }

    // Top notice
    const notice = document.createElement('div');
    notice.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#000;color:#fff;padding:12px 24px;z-index:9999;font-family:"Instrument Sans",sans-serif;font-size:14px;letter-spacing:0.5px;';
    notice.textContent = 'Please login to continue checkout';
    document.body.appendChild(notice);
    return;
  }

  [products, cartItems] = await Promise.all([
    getAllProducts(),
    getCart()
  ]);
  renderOrderSummary();
}

// ===== RENDER ORDER SUMMARY =====
function renderOrderSummary() {
  const orderItems = document.getElementById('orderItems');
  const orderSubtotal = document.getElementById('orderSubtotal');
  const orderTotal = document.getElementById('orderTotal');
  if (!orderItems) return;

  let subtotal = 0;

  if (cartItems.length === 0) {
    orderItems.innerHTML = `<p style="font-size:14px;color:#888;padding:16px 0;">Your cart is empty. <a href="shop.html" style="color:#c8a97e;">Go shopping</a></p>`;
  } else {
    orderItems.innerHTML = cartItems.map(item => {
      const price = item.price || 0;
      const qty = item.quantity || 1;
      subtotal += price * qty;
      return `
        <div class="order-item">
          <span class="order-item-name">${item.name} <span>× ${qty}</span></span>
          <span class="order-item-price">$${(price * qty).toFixed(2)}</span>
        </div>
      `;
    }).join('');
  }

  updateTotals(subtotal, orderSubtotal, orderTotal);
  updateShippingBar(subtotal);
}

// ===== UPDATE TOTALS =====
function updateTotals(subtotal, subtotalEl, totalEl) {
  if (subtotal === undefined) {
    subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    subtotalEl = document.getElementById('orderSubtotal');
    totalEl = document.getElementById('orderTotal');
  }

  const shippingRadio = document.querySelector('input[name="checkoutShipping"]:checked');
  const shipping = shippingRadio ? parseFloat(shippingRadio.value) : 15;

  let discountedSubtotal = subtotal;
  if (discountPercent > 0) discountedSubtotal = subtotal * (1 - discountPercent / 100);

  const total = discountedSubtotal + shipping;
  if (subtotalEl) subtotalEl.textContent = `$${discountedSubtotal.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// ===== SHIPPING BAR =====
function updateShippingBar(subtotal) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const fill = document.getElementById('checkoutShippingFill');
  const text = document.getElementById('checkoutShippingText');
  if (fill) fill.style.width = percent + '%';
  if (text) {
    text.innerHTML = remaining > 0
      ? `Add <strong>$${remaining.toFixed(2)}</strong> to cart and get free shipping!`
      : `🎉 You have free shipping!`;
  }
}

// ===== COUPON =====
document.getElementById('toggleCoupon')?.addEventListener('click', (e) => {
  e.preventDefault();
  const form = document.getElementById('couponForm');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('applyCouponBtn')?.addEventListener('click', () => {
  const code = document.getElementById('checkoutCouponInput')?.value.trim().toUpperCase();
  const msg = document.getElementById('couponMsg');
  if (code === 'NURFIA10') {
    discountPercent = 10;
    msg.textContent = '✓ Coupon applied! 10% discount added.';
    msg.className = 'coupon-msg success';
  } else {
    discountPercent = 0;
    msg.textContent = '✗ Invalid coupon code.';
    msg.className = 'coupon-msg error';
  }
  updateTotals();
});

// ===== SHIPPING CHANGE =====
document.querySelectorAll('input[name="checkoutShipping"]').forEach(radio => {
  radio.addEventListener('change', () => updateTotals());
});

// ===== SHIP TO DIFFERENT ADDRESS =====
document.getElementById('shipDifferent')?.addEventListener('change', (e) => {
  const section = document.getElementById('differentAddress');
  if (section) section.style.display = e.target.checked ? 'block' : 'none';
});

// ===== PAYMENT METHOD TOGGLE =====
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const bankDesc = document.getElementById('bankDesc');
    if (bankDesc) bankDesc.style.display = radio.value === 'bank' && radio.checked ? 'block' : 'none';
  });
});

// ===== VALIDATION =====
function validateForm() {
  let valid = true;
  const fields = [
    { id: 'firstName',     errId: 'firstNameErr', msg: 'First name is required.' },
    { id: 'lastName',      errId: 'lastNameErr',  msg: 'Last name is required.' },
    { id: 'streetAddress', errId: 'streetErr',    msg: 'Street address is required.' },
    { id: 'city',          errId: 'cityErr',      msg: 'Town / City is required.' },
    { id: 'zipCode',       errId: 'zipErr',       msg: 'ZIP Code is required.' },
  ];

  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const err = document.getElementById(f.errId);
    if (!input || !err) return;
    if (!input.value.trim()) {
      err.textContent = f.msg;
      input.classList.add('error');
      valid = false;
    } else {
      err.textContent = '';
      input.classList.remove('error');
    }
  });

  const email = document.getElementById('email');
  const emailErr = document.getElementById('emailErr');
  if (email && emailErr) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
      emailErr.textContent = 'Email address is required.';
      email.classList.add('error');
      valid = false;
    } else if (!emailRegex.test(email.value.trim())) {
      emailErr.textContent = 'Please enter a valid email address.';
      email.classList.add('error');
      valid = false;
    } else {
      emailErr.textContent = '';
      email.classList.remove('error');
    }
  }

  const terms = document.getElementById('agreeTerms');
  const termsErr = document.getElementById('termsErr');
  if (terms && termsErr) {
    if (!terms.checked) {
      termsErr.textContent = 'You must agree to the terms and conditions.';
      valid = false;
    } else {
      termsErr.textContent = '';
    }
  }

  if (cartItems.length === 0) {
    alert('Your cart is empty. Please add items before checking out.');
    valid = false;
  }

  return valid;
}

// ===== PLACE ORDER =====
document.getElementById('placeOrderBtn')?.addEventListener('click', async () => {
  if (!validateForm()) return;

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  try {
    let subtotal = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

    const shippingRadio = document.querySelector('input[name="checkoutShipping"]:checked');
    const shipping = shippingRadio ? parseFloat(shippingRadio.value) : 15;
    const shippingLabel = shippingRadio?.value === '0' ? 'Local pickup' : 'Flat rate: $15.00';

    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentLabel = {
      bank: 'Direct Bank Transfer',
      check: 'Check Payments',
      cod: 'Cash On Delivery'
    }[paymentRadio?.value] || 'Direct Bank Transfer';

    if (discountPercent > 0) subtotal = subtotal * (1 - discountPercent / 100);
    const total = subtotal + shipping;

    const firstName = document.getElementById('firstName')?.value || '';
    const lastName  = document.getElementById('lastName')?.value || '';
    const email     = document.getElementById('email')?.value || '';
    const address   = document.getElementById('streetAddress')?.value || '';
    const city      = document.getElementById('city')?.value || '';
    const zipCode   = document.getElementById('zipCode')?.value || '';

    const token = getToken();
    if (!token) {
      alert('Please login to place an order.');
      btn.disabled = false;
      btn.textContent = 'PLACE ORDER';
      return;
    }

    // ===== ORDER PAYLOAD =====
    const orderData = {
      orderItems: cartItems.map(item => ({
        product: item.product?._id || item.product,
        name: item.name,
        image: item.image || item.product?.image || '',
        price: item.price,
        quantity: item.quantity
      })),
      shippingAddress: {
        address,
        city,
        postalCode: zipCode,
        country: document.getElementById('country')?.value || 'Pakistan'
      },
      paymentMethod: paymentRadio?.value || 'cod',
      totalPrice: total
    };

    // ===== API CALL =====
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'Order failed');
    }

    const createdOrder = await res.json();

    // ===== CLEAR BACKEND CART =====
    await clearBackendCart();

    // ===== SUCCESS MODAL =====
    const orderId = createdOrder._id || ('NRF-' + Math.random().toString(36).substr(2, 8).toUpperCase());
    const details = document.getElementById('successDetails');
    if (details) {
      const bankReminder = paymentRadio?.value === 'bank'
        ? `<p style="margin-top:10px;color:#c8a97e;font-weight:600;">Please transfer the payment using Order ID <u>${orderId}</u> as reference. Your order will ship after we confirm the payment.</p>`
        : '';

      details.innerHTML = `
        <strong>Order ID:</strong> ${orderId}<br>
        <strong>Name:</strong> ${firstName} ${lastName}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Payment:</strong> ${paymentLabel}<br>
        <strong>Shipping:</strong> ${shippingLabel}<br>
        <strong>Total:</strong> $${total.toFixed(2)}
        ${bankReminder}
      `;
    }

    const overlay = document.getElementById('successOverlay');
    if (overlay) overlay.style.display = 'flex';

    // Cart badge reset
    document.querySelectorAll('.cart-count:not(.wishlist-count)').forEach(b => b.textContent = '0');
    cartItems = [];

  } catch (err) {
    console.error('Order error:', err);
    alert('Order place karne mein error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'PLACE ORDER';
  }
});

// ===== LIVE VALIDATION =====
['firstName','lastName','streetAddress','city','zipCode','email'].forEach(id => {
  document.getElementById(id)?.addEventListener('input', () => {
    const errId = {
      firstName: 'firstNameErr', lastName: 'lastNameErr',
      streetAddress: 'streetErr', city: 'cityErr',
      zipCode: 'zipErr', email: 'emailErr'
    }[id];
    const input = document.getElementById(id);
    const err = document.getElementById(errId);
    if (input?.value.trim() && err) {
      err.textContent = '';
      input.classList.remove('error');
    }
  });
});

init();