import products from './api/products.json';

const FREE_SHIPPING_THRESHOLD = 500;
let discountPercent = 0;

// ===== READ CART =====
function getCart() {
  return JSON.parse(localStorage.getItem('nurfia_cart') || '[]');
}

// ===== RENDER ORDER SUMMARY =====
function renderOrderSummary() {
  const cart = getCart();
  const orderItems = document.getElementById('orderItems');
  const orderSubtotal = document.getElementById('orderSubtotal');
  const orderTotal = document.getElementById('orderTotal');

  if (!orderItems) return;

  let subtotal = 0;

  if (cart.length === 0) {
    orderItems.innerHTML = `<p style="font-size:14px;color:#888;padding:16px 0;">Your cart is empty. <a href="shop.html" style="color:#c8a97e;">Go shopping</a></p>`;
  } else {
    orderItems.innerHTML = cart.map(item => {
      const p = products.find(prod => prod.id === item.id);
      if (!p) return '';
      const price = p.salePrice || p.price;
      subtotal += price * item.qty;
      return `
        <div class="order-item">
          <span class="order-item-name">${p.name} <span>× ${item.qty}</span></span>
          <span class="order-item-price">$${(price * item.qty).toFixed(2)}</span>
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
    const cart = getCart();
    subtotal = cart.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.id);
      return sum + (p ? (p.salePrice || p.price) * item.qty : 0);
    }, 0);
    subtotalEl = document.getElementById('orderSubtotal');
    totalEl = document.getElementById('orderTotal');
  }

  const shippingRadio = document.querySelector('input[name="checkoutShipping"]:checked');
  const shipping = shippingRadio ? parseFloat(shippingRadio.value) : 15;

  let discountedSubtotal = subtotal;
  if (discountPercent > 0) {
    discountedSubtotal = subtotal * (1 - discountPercent / 100);
  }

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

// ===== COUPON TOGGLE =====
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
    if (bankDesc) {
      bankDesc.style.display = radio.value === 'bank' && radio.checked ? 'block' : 'none';
    }
  });
});

// ===== VALIDATION =====
function validateForm() {
  let valid = true;

  const fields = [
    { id: 'firstName',   errId: 'firstNameErr',  msg: 'First name is required.' },
    { id: 'lastName',    errId: 'lastNameErr',   msg: 'Last name is required.' },
    { id: 'streetAddress', errId: 'streetErr',   msg: 'Street address is required.' },
    { id: 'city',        errId: 'cityErr',       msg: 'Town / City is required.' },
    { id: 'zipCode',     errId: 'zipErr',        msg: 'ZIP Code is required.' },
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

  // Email validation
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

  // Terms checkbox
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

  // Cart not empty
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty. Please add items before checking out.');
    valid = false;
  }

  return valid;
}

// ===== PLACE ORDER =====
document.getElementById('placeOrderBtn')?.addEventListener('click', () => {
  if (!validateForm()) return;

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Processing...';

  // Simulate processing delay
  setTimeout(() => {
    const cart = getCart();
    let subtotal = cart.reduce((sum, item) => {
      const p = products.find(prod => prod.id === item.id);
      return sum + (p ? (p.salePrice || p.price) * item.qty : 0);
    }, 0);

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

    const orderId = 'NRF-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const firstName = document.getElementById('firstName')?.value || '';
    const lastName = document.getElementById('lastName')?.value || '';
    const email = document.getElementById('email')?.value || '';

    // Show success modal
    const details = document.getElementById('successDetails');
    if (details) {
      details.innerHTML = `
        <strong>Order ID:</strong> ${orderId}<br>
        <strong>Name:</strong> ${firstName} ${lastName}<br>
        <strong>Email:</strong> ${email}<br>
        <strong>Payment:</strong> ${paymentLabel}<br>
        <strong>Shipping:</strong> ${shippingLabel}<br>
        <strong>Total:</strong> $${total.toFixed(2)}
      `;
    }

    // Clear cart
    localStorage.setItem('nurfia_cart', '[]');

    // Show modal
    const overlay = document.getElementById('successOverlay');
    if (overlay) overlay.style.display = 'flex';

  }, 1200);
});

// ===== LIVE VALIDATION (clear errors on input) =====
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

// ===== INIT =====
renderOrderSummary();