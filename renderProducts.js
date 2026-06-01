import { addToCart } from './cart.js';

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

function toggleWishlist(id, btn) {
  let list = getWishlist();
  if (list.includes(id)) {
    list = list.filter(i => i !== id);
    btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
    btn.style.background = '#fff';
    btn.style.color = '#1a1a1a';
  } else {
    list.push(id);
    btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    btn.style.background = '#000';
    btn.style.color = '#fff';
    showWishlistModal(id);
  }
  saveWishlist(list);
}

function showWishlistModal(productId) {
  const modal   = document.getElementById('wishlistModal');
  const overlay = document.getElementById('modalOverlay');
  const nameEl  = document.getElementById('modalProductName');

  if (!modal) return;

  // Try to get product name from products import if available
  if (nameEl) nameEl.textContent = `Product #${productId}`;

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

// ===== INIT BADGES ON PAGE LOAD =====
updateWishlistBadges();

// ===== RENDER PRODUCTS =====
export const renderProducts = (products, container) => {
  container.innerHTML = "";

  products.forEach((product) => {
    const stars = "★".repeat(Math.round(product.rating)) +
                  "☆".repeat(5 - Math.round(product.rating));

    const inWishlist = isInWishlist(product.id);

    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.cursor = 'pointer';
    card.innerHTML = `
      <div class="product-card-image">
        ${product.discount > 0 ?
          `<span class="product-badge">${product.discount}%</span>` : ""}
        ${product.video ?
          `<video autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover;">
            <source src="${product.video}" type="video/mp4" />
          </video>`
          :
          `<img src="${product.image}" alt="${product.name}" />`
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
          <button class="add-cart-btn" data-id="${product.id}">ADD TO CART</button>
        </div>
      </div>
      <div class="product-card-info">
        <p class="product-card-name">${product.name}</p>
        <div class="product-card-prices">
          <span class="product-sale-price">$${product.salePrice}</span>
          ${product.discount > 0 ?
            `<span class="product-original-price">$${product.price}</span>` : ""}
        </div>
        <div class="product-rating">
          <span class="stars">${stars}</span>
          <span>${product.rating} (${product.reviews})</span>
        </div>
      </div>
    `;

    // Add to cart
    card.querySelector('.add-cart-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(product.id);
    });

    // Wishlist toggle
    card.querySelector('.wishlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWishlist(product.id, e.currentTarget);
    });

    // Quickview — stop propagation only
    card.querySelector('.quickview-btn').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Click card → go to product page
    card.addEventListener('click', () => {
      window.location.href = `product.html?id=${product.id}`;
    });

    container.appendChild(card);
  });
};