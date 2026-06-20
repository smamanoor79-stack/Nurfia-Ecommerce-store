import { addToCart } from './cart.js';
import { addToBackendWishlist, removeFromBackendWishlist, getToken, isLoggedIn } from './api.js';

// ===== WISHLIST HELPERS =====
function getWishlist() {
  return JSON.parse(localStorage.getItem('nurfia_wishlist') || '[]');
}

function saveWishlist(list) {
  localStorage.setItem('nurfia_wishlist', JSON.stringify(list));
  updateWishlistBadges();
}

function updateWishlistBadges() {
  const count = getWishlist().length;
  document.querySelectorAll('.wishlist-count').forEach(el => {
    el.textContent = count;
  });
}

function isInWishlist(id) {
  return getWishlist().includes(id);
}

function toggleWishlist(id, btn, product = {}) {
  let list = getWishlist();

  if (list.includes(id)) {
    list = list.filter(i => i !== id);
    btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    btn.style.background = '#fff';
    btn.style.color = '#1a1a1a';
    // Backend se bhi remove karo, sirf agar logged in ho
    if (isLoggedIn()) {
      removeFromBackendWishlist(id).catch(err => console.error(err));
    }
  } else {
    list.push(id);
    btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    btn.style.background = '#000';
    btn.style.color = '#fff';
    showWishlistModal(id);
    // Backend pe bhi add karo, sirf agar logged in ho
    if (isLoggedIn()) {
      addToBackendWishlist(
        id,
        product.name || '',
        product.image || '',
        product.salePrice || product.price || 0
      ).catch(err => console.error(err));
    }
  }

  saveWishlist(list);
}

function showWishlistModal(productId) {
  const modal   = document.getElementById('wishlistModal');
  const overlay = document.getElementById('modalOverlay');
  const nameEl  = document.getElementById('modalProductName');
  if (!modal) return;
  if (nameEl) nameEl.textContent = `Product added to wishlist!`;
  modal.classList.add('active');
  overlay.classList.add('active');
  document.getElementById('closeWishlistModal')?.addEventListener('click', () => {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }, { once: true });
  overlay.addEventListener('click', () => {
    modal.classList.remove('active');
    overlay.classList.remove('active');
  }, { once: true });
}

updateWishlistBadges();

// ===== RENDER PRODUCTS =====
export const renderProducts = (products, container) => {
  container.innerHTML = "";

  products.forEach((product) => {
    const id = product._id;
    const stars = "★".repeat(Math.round(product.rating)) +
                  "☆".repeat(5 - Math.round(product.rating));
    const inWishlist = isInWishlist(id);

    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="product-card-image">
        ${product.discount > 0 ? `<span class="product-badge">${product.discount}%</span>` : ""}
        ${product.image && product.image.endsWith('.mp4')
          ? `<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;">
               <source src="${product.image}" type="video/mp4" />
             </video>`
          : product.video
            ? `<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;">
                 <source src="${product.video}" type="video/mp4" />
               </video>`
            : `<img src="${product.image}" alt="${product.name}" />`
        }
        <div class="card-hover-actions">
          <button class="hover-btn wishlist-btn" style="${inWishlist ? 'background:#000;color:#fff;' : ''}">
            <i class="${inWishlist ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
          </button>
          <button class="hover-btn quickview-btn">
            <i class="fa-regular fa-eye"></i>
          </button>
        </div>
        <div class="card-add-to-cart">
          <button class="add-cart-btn">ADD TO CART</button>
        </div>
      </div>
      <div class="product-card-info">
        <p class="product-card-name">${product.name}</p>
        <div class="product-card-prices">
          <span class="product-sale-price">$${product.salePrice}</span>
          ${product.discount > 0 ? `<span class="product-original-price">$${product.price}</span>` : ""}
        </div>
        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span>${product.rating} (${product.reviews})</span>
        </div>
      </div>
    `;

    card.querySelector('.add-cart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(id);
    });

    card.querySelector('.wishlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(id, e.currentTarget, product);
    });

    card.querySelector('.quickview-btn').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    card.addEventListener('click', () => {
      window.location.href = `product.html?id=${id}`;
    });

    container.appendChild(card);
  });
};