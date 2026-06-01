import products from './api/products.json';
import { addToCart } from './cart.js';

// State references
let wishlist = JSON.parse(localStorage.getItem('nurfia_wishlist')) || [];

// Target DOM pointers
const tableBody = document.getElementById('wishlistTableBody');
const emptyContainer = document.getElementById('wishlistEmpty');
const actionsRow = document.getElementById('wishlistActions');
const tableElement = document.querySelector('.cart-table');

export function renderWishlistPage() {
  if (!tableBody) return;

  // Sync internal local storage data
  wishlist = JSON.parse(localStorage.getItem('nurfia_wishlist')) || [];
  updateGlobalWishlistBadges();

  // Handle Empty State visual blocks
  if (wishlist.length === 0) {
    if (tableElement) tableElement.style.display = 'none';
    if (actionsRow) actionsRow.style.display = 'none';
    if (emptyContainer) emptyContainer.style.display = 'block';
    return;
  }

  // Active items block recovery
  if (tableElement) tableElement.style.display = 'table';
  if (actionsRow) actionsRow.style.display = 'flex';
  if (emptyContainer) emptyContainer.style.display = 'none';

  // Cross-reference data loop injection
  const wishlistProducts = wishlist.map(id => products.find(p => p.id === id)).filter(Boolean);

  tableBody.innerHTML = wishlistProducts.map(p => `
    <tr style="border-bottom: 1px solid #eee;">
      <td class="product-thumbnail-cell" style="padding: 15px 0; display: flex; align-items: center; gap: 15px;">
        ${p.video 
          ? `<video src="${p.video}" muted playsinline autoplay loop style="width: 65px; height: 75px; object-fit: cover;"></video>`
          : `<img src="${p.image}" alt="${p.name}" style="width: 65px; height: 75px; object-fit: cover;" />`
        }
        <span class="product-name-link" style="font-family: 'Instrument Sans', sans-serif; font-weight: 500; color: #000;">${p.name}</span>
      </td>
      
      <td class="product-price-cell" style="font-family: 'Instrument Sans', sans-serif;">
        <span style="color: #555;">$${(p.salePrice || p.price).toFixed(2)}</span>
      </td>
      
      <td class="product-stock-cell" style="font-family: 'Instrument Sans', sans-serif;">
        <span style="color: #27ae60; font-weight: 500;">
          <i class="fa-solid fa-check" style="font-size: 12px; margin-right: 4px;"></i> ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      
      <td class="product-atc-cell">
        <button class="wishlist-add-to-cart-btn raw-atc-trigger" data-id="${p.id}" 
          style="background: #000; color: #fff; border: none; padding: 12px 24px; font-weight: 600; font-family: 'Instrument Sans', sans-serif; font-size: 12px; letter-spacing: 0.5px; cursor: pointer; text-transform: uppercase; transition: background 0.2s;">
          Add To Cart
        </button>
      </td>
      
      <td class="product-remove-cell" style="text-align: right;">
        <button class="remove-wishlist-item-btn" data-id="${p.id}" style="background: transparent; border: none; color: #999; cursor: pointer; font-size: 18px; padding: 5px 10px;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </td>
    </tr>
  `).join('');

  bindActionTriggers();
}

// Attach isolated runtime micro events
function bindActionTriggers() {
  // 1. Terminate item trigger bind
  tableBody.querySelectorAll('.remove-wishlist-item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = parseInt(btn.dataset.id);
      let activeItems = JSON.parse(localStorage.getItem('nurfia_wishlist')) || [];
      activeItems = activeItems.filter(id => id !== targetId);
      localStorage.setItem('nurfia_wishlist', JSON.stringify(activeItems));
      renderWishlistPage(); // Perform hot refresh cycle
    });
  });

  // 2. Conversion engine bridge execution map
  tableBody.querySelectorAll('.raw-atc-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = parseInt(btn.dataset.id);
      addToCart(targetId); // Hit standard operational cart engine directly
    });
  });
}

// Global counters syncer layout execution
function updateGlobalWishlistBadges() {
  const currentList = JSON.parse(localStorage.getItem('nurfia_wishlist')) || [];
  const badges = document.querySelectorAll('.wishlist-count');
  if (badges) {
    badges.forEach(badge => {
      badge.textContent = currentList.length;
    });
  }
}

// Clear all context controller
document.getElementById('clearWishlistBtn')?.addEventListener('click', () => {
  localStorage.setItem('nurfia_wishlist', JSON.stringify([]));
  renderWishlistPage();
});

// Init sequence engine deployment
renderWishlistPage();