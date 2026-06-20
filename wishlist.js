// wishlist.js
import { getAllProducts, getBackendWishlist, addToBackendWishlist, removeFromBackendWishlist, isLoggedIn } from './api.js';
import { addToCart } from './cart.js';

let wishlistItems = []; // backend se aaya hua array of items
let products = [];

const tableBody = document.getElementById('wishlistTableBody');
const emptyContainer = document.getElementById('wishlistEmpty');
const actionsRow = document.getElementById('wishlistActions');
const tableElement = document.querySelector('.cart-table');

export function updateGlobalWishlistBadges(count) {
  document.querySelectorAll('.wishlist-count').forEach(badge => {
    badge.textContent = count;
  });
}

//  Backend se wishlist fetch karo aur badge update karo
export async function fetchAndUpdateWishlistBadge() {
  if (!isLoggedIn()) {
    updateGlobalWishlistBadges(0);
    return [];
  }
  try {
    const data = await getBackendWishlist();
   const items = data.wishlistItems || [];
    updateGlobalWishlistBadges(items.length);
    return items;
  } catch (err) {
    console.error('Wishlist fetch failed:', err);
    updateGlobalWishlistBadges(0);
    return [];
  }
}

// localStorage wishlist (guest) ko backend pe push karo after login
export async function syncWishlistToBackend() {
  if (!isLoggedIn()) return;
  const localIds = JSON.parse(localStorage.getItem('nurfia_wishlist') || '[]');
  if (localIds.length === 0) return;

  try {
    await Promise.all(localIds.map(id => addToBackendWishlist(id)));
    localStorage.removeItem('nurfia_wishlist');
  } catch (err) {
    console.error('Wishlist sync failed:', err);
  }
}

async function init() {
  products = await getAllProducts();

  if (isLoggedIn()) {
    // Backend se fetch karo aur localStorage sync karo
    wishlistItems = await fetchAndUpdateWishlistBadge();
    // localStorage bhi update karo taaki renderProducts sahi dikhaye
    const ids = wishlistItems.map(item => item.product?._id || item.product);
    localStorage.setItem('nurfia_wishlist', JSON.stringify(ids));
  } else {
    // Logout mein localStorage se dikhao
    const ids = JSON.parse(localStorage.getItem('nurfia_wishlist') || '[]');
    wishlistItems = ids.map(id => ({ product: id }));
    updateGlobalWishlistBadges(ids.length); // FIX: actual count, hardcoded 0 nahi
  }

  renderWishlistPage();
}

export function renderWishlistPage() {
  if (!tableBody) return;

  if (wishlistItems.length === 0) {
    if (tableElement) tableElement.style.display = 'none';
    if (actionsRow) actionsRow.style.display = 'none';
    if (emptyContainer) emptyContainer.style.display = 'block';
    return;
  }

  if (tableElement) tableElement.style.display = 'table';
  if (actionsRow) actionsRow.style.display = 'flex';
  if (emptyContainer) emptyContainer.style.display = 'none';

  // Backend wishlist item mein product field hoti hai
  const wishlistProducts = wishlistItems.map(item => {
    const id = item.product?._id || item.product;
    return products.find(p => p._id === id);
  }).filter(Boolean);

  tableBody.innerHTML = wishlistProducts.map(p => `
    <tr style="border-bottom: 1px solid #eee;">
      <td class="product-thumbnail-cell" style="padding: 15px 0; display: flex; align-items: center; gap: 15px;">
        ${p.image && p.image.endsWith('.mp4')
          ? `<video src="${p.image}" muted playsinline autoplay loop style="width: 65px; height: 75px; object-fit: cover;"></video>`
          : p.video
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
          <i class="fa-solid fa-check" style="font-size: 12px; margin-right: 4px;"></i>
          ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </span>
      </td>
      <td class="product-atc-cell">
        <button class="wishlist-add-to-cart-btn raw-atc-trigger" data-id="${p._id}"
          style="background: #000; color: #fff; border: none; padding: 12px 24px; font-weight: 600; font-family: 'Instrument Sans', sans-serif; font-size: 12px; letter-spacing: 0.5px; cursor: pointer; text-transform: uppercase;">
          Add To Cart
        </button>
      </td>
      <td class="product-remove-cell" style="text-align: right;">
        <button class="remove-wishlist-item-btn" data-id="${p._id}" style="background: transparent; border: none; color: #999; cursor: pointer; font-size: 18px; padding: 5px 10px;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </td>
    </tr>
  `).join('');

  bindActionTriggers();
}

function bindActionTriggers() {
  tableBody.querySelectorAll('.remove-wishlist-item-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.dataset.id;
      try {
        if (isLoggedIn()) {
          await removeFromBackendWishlist(targetId);
        } else {
          // Guest: localStorage se hi remove karo
          const ids = JSON.parse(localStorage.getItem('nurfia_wishlist') || '[]');
          const updated = ids.filter(id => id !== targetId);
          localStorage.setItem('nurfia_wishlist', JSON.stringify(updated));
        }
        wishlistItems = wishlistItems.filter(item => {
          const id = item.product?._id || item.product;
          return id !== targetId;
        });
        updateGlobalWishlistBadges(wishlistItems.length);
        renderWishlistPage();
      } catch (err) {
        console.error('Remove from wishlist failed:', err);
      }
    });
  });

  tableBody.querySelectorAll('.raw-atc-trigger').forEach(btn => {
  btn.addEventListener('click', async () => {
    await addToCart(btn.dataset.id);
    window.location.href = 'cart.html';
  });
});
}

document.getElementById('clearWishlistBtn')?.addEventListener('click', async () => {
  try {
    if (isLoggedIn()) {
      // Backend pe clear endpoint nahi hai, toh ek ek remove karo
      await Promise.all(
        wishlistItems.map(item => {
          const id = item.product?._id || item.product;
          return removeFromBackendWishlist(id);
        })
      );
    } else {
      // Guest: localStorage hi clear karo
      localStorage.removeItem('nurfia_wishlist');
    }
    wishlistItems = [];
    updateGlobalWishlistBadges(0);
    renderWishlistPage();
  } catch (err) {
    console.error('Clear wishlist failed:', err);
  }
});

init();