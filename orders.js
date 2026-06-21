import { isLoggedIn, getMyOrders, getImageUrl } from './api.js';

const ordersLoading = document.getElementById('ordersLoading');
const ordersLoginRequired = document.getElementById('ordersLoginRequired');
const ordersEmpty = document.getElementById('ordersEmpty');
const ordersList = document.getElementById('ordersList');

// ===== STATUS HELPERS =====
function getPaymentStatusBadge(order) {
  if (order.isPaid) {
    return `<span class="order-badge order-badge--paid"><i class="fa-solid fa-check"></i> Paid</span>`;
  }
  if (order.paymentMethod === 'cod') {
    return `<span class="order-badge order-badge--pending"><i class="fa-solid fa-clock"></i> Pay on Delivery</span>`;
  }
  return `<span class="order-badge order-badge--pending"><i class="fa-solid fa-clock"></i> Payment Pending</span>`;
}

function getDeliveryStatusBadge(order) {
  if (order.isDelivered) {
    return `<span class="order-badge order-badge--delivered"><i class="fa-solid fa-truck"></i> Delivered</span>`;
  }
  return `<span class="order-badge order-badge--processing"><i class="fa-solid fa-box"></i> Processing</span>`;
}

function getPaymentMethodLabel(method) {
  const labels = {
    cod: 'Cash on Delivery',
    bank: 'Direct Bank Transfer',
    check: 'Check Payment'
  };
  return labels[method] || method;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== RENDER ORDERS =====
function renderOrders(orders) {
  if (orders.length === 0) {
    ordersEmpty.style.display = 'flex';
    return;
  }

  // Sab se naya order pehle
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  ordersList.innerHTML = sorted.map(order => {
    const itemsPreview = order.orderItems.map(item => `
      <div class="order-item-row">
        <img src="${getImageUrl(item.image)}" alt="${item.name}" class="order-item-thumb" />
        <div class="order-item-details">
          <p class="order-item-name">${item.name}</p>
          <p class="order-item-qty">Qty: ${item.quantity} &nbsp;•&nbsp; $${item.price.toFixed(2)}</p>
        </div>
      </div>
    `).join('');

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div>
            <p class="order-id">Order #${order._id.slice(-8).toUpperCase()}</p>
            <p class="order-date">Placed on ${formatDate(order.createdAt)}</p>
          </div>
          <div class="order-badges">
            ${getPaymentStatusBadge(order)}
            ${getDeliveryStatusBadge(order)}
          </div>
        </div>

        <div class="order-card-items">
          ${itemsPreview}
        </div>

        <div class="order-card-footer">
          <div class="order-footer-info">
            <p><strong>Payment method:</strong> ${getPaymentMethodLabel(order.paymentMethod)}</p>
            <p><strong>Ship to:</strong> ${order.shippingAddress.address}, ${order.shippingAddress.city}</p>
          </div>
          <div class="order-footer-total">
            <p class="order-total-label">Total</p>
            <p class="order-total-amount">$${order.totalPrice.toFixed(2)}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== INIT =====
async function init() {
  if (!isLoggedIn()) {
    ordersLoading.style.display = 'none';
    ordersLoginRequired.style.display = 'flex';
    return;
  }

  try {
    const orders = await getMyOrders();
    ordersLoading.style.display = 'none';
    renderOrders(orders);
  } catch (err) {
    console.error('Failed to load orders:', err);
    ordersLoading.style.display = 'none';
    ordersList.innerHTML = `<p style="text-align:center;color:#c0392b;padding:40px 0;">Could not load your orders. Please try again later.</p>`;
  }
}

document.getElementById('ordersLoginBtn')?.addEventListener('click', () => {
  document.getElementById('authModal')?.classList.add('active');
  document.getElementById('authModalOverlay')?.classList.add('active');
});

init();