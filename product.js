import products from './api/products.json';
import { addToCart } from './cart.js';

const colorNames = {
 '#000000': 'Black', '#FFFFFF': 'White', '#808080': 'Gray',
 '#FF0000': 'Red', '#0000FF': 'Blue', '#90EE90': 'Light Green',
 '#8B4513': 'Brown', '#FFA500': 'Orange', '#FFD700': 'Yellow',
 '#87CEEB': 'Sky Blue', '#556B2F': 'Olive Green', '#8B008B': 'Purple',
 '#F5DEB3': 'Beige', '#AED6F1': 'Light Blue', '#FFB6C1': 'Pink',
 '#8B0000': 'Dark Red', '#FFFACD': 'Light Yellow', '#E8A090': 'Salmon'
};

// ===== GET PRODUCT ID FROM URL =====
const params = new URLSearchParams(window.location.search);
const productId = parseInt(params.get('id'));
const product = products.find(p => p.id === productId);

if (!product) {
  document.getElementById('productDetailPage').innerHTML =
    `<div style="padding:80px 24px;text-align:center;">
      <h2>Product not found.</h2>
      <a href="shop.html" style="color:#c8a97e;">Back to Shop</a>
    </div>`;
} else {
  initProductPage(product);
}

function initProductPage(p) {
  // ===== BREADCRUMB =====
  document.getElementById('breadcrumbName').textContent = p.name;
  document.title = `${p.name} – Nurfia`;

  // ===== GALLERY =====
  const mainEl = document.getElementById('galleryMain');
  const thumbsEl = document.getElementById('galleryThumbs');

  const allMedia = p.images && p.images.length > 0 ? p.images : [p.image];

  function isVideo(src) {
    return src && (src.endsWith('.mp4') || src.endsWith('.webm'));
  }

  function setMainMedia(src) {
    if (isVideo(src)) {
      mainEl.innerHTML = `<video src="${src}" autoplay muted loop playsinline></video>`;
    } else {
      mainEl.innerHTML = `
        ${p.discount ? `<span class="gallery-badge">${p.discount}%</span>` : ''}
        <img src="${src}" alt="${p.name}" />
      `;
    }
  }

  // Set first image
  setMainMedia(allMedia[0]);

  // Thumbnails
  allMedia.forEach((src, i) => {
    let thumb;
    if (isVideo(src)) {
      thumb = document.createElement('video');
      thumb.src = src;
      thumb.muted = true;
      thumb.loop = true;
      thumb.autoplay = true;
      thumb.setAttribute('playsinline', '');
    } else {
      thumb = document.createElement('img');
      thumb.src = src;
      thumb.alt = p.name;
    }
    thumb.className = 'gallery-thumb' + (i === 0 ? ' active' : '');
    thumb.addEventListener('click', () => {
      document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      setMainMedia(src);
    });
    thumbsEl.appendChild(thumb);
  });

  // ===== STARS =====
  const fullStars = Math.round(p.rating);
  const starsHtml = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  document.getElementById('productStars').innerHTML =
    `${starsHtml} <span>${p.rating} (${p.reviews} reviews)</span>`;

  // ===== SKU =====
  document.getElementById('productSku').textContent = 'NRF' + String(p.id).padStart(6, '0') + p.name.replace(/\s/g, '').substr(0, 3).toUpperCase();

  // ===== TITLE =====
  document.getElementById('productTitle').textContent = p.name;

  // ===== PRICING =====
  document.getElementById('productPricing').innerHTML = `
    <span class="price-sale">$${p.salePrice.toFixed(2)}</span>
    ${p.discount > 0 ? `<span class="price-original">$${p.price.toFixed(2)}</span>` : ''}
    <span class="price-stock">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
  `;

  // ===== DESCRIPTION =====
  document.getElementById('productDescription').textContent = p.description;
  
  // ADJUSTED: Fixed script crash point by setting text directly to the element
  const tabDescEl = document.getElementById('tabDescription');
  if (tabDescEl) tabDescEl.textContent = p.description;

  document.getElementById('reviewCount').textContent = p.reviews;
  document.getElementById('reviewCount2').textContent = `Based on ${p.reviews} review(s)`;
  document.getElementById('reviewScore').textContent = p.rating.toFixed(1);

  // ===== COLORS =====
  let selectedColor = p.colors[0];
  document.getElementById('selectedColorName').textContent = colorNames[selectedColor] || selectedColor;

  const swatchesEl = document.getElementById('colorSwatches');
  p.colors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (color === selectedColor ? ' active' : '');
    swatch.style.background = color;
    swatch.style.border = color === '#FFFFFF' ? '2px solid #ddd' : '2px solid transparent';
    swatch.title = colorNames[color] || color;
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      selectedColor = color;
      document.getElementById('selectedColorName').textContent = colorNames[color] || color;
    });
    swatchesEl.appendChild(swatch);
  });

  // ===== SIZES =====
  let selectedSize = p.sizes[0];
  document.getElementById('selectedSizeName').textContent = selectedSize;

  const sizeBtnsEl = document.getElementById('sizeBtns');
  p.sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.className = 'size-btn' + (size === selectedSize ? ' active' : '');
    btn.textContent = size;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = size;
      document.getElementById('selectedSizeName').textContent = size;
    });
    sizeBtnsEl.appendChild(btn);
  });

  // ===== QUANTITY (INCREMENT/DECREMENT) =====
  let qty = 1;
  const qtyInput = document.getElementById('qtyInput');

  document.getElementById('qtyMinus').addEventListener('click', () => {
    if (qty > 1) { 
      qty--; 
      qtyInput.value = qty; 
    }
  });

  document.getElementById('qtyPlus').addEventListener('click', () => {
    if (qty < p.stock) { 
      qty++; 
      qtyInput.value = qty; 
    }
  });

  qtyInput.addEventListener('change', (e) => {
    qty = Math.max(1, Math.min(p.stock, parseInt(e.target.value) || 1));
    e.target.value = qty;
  });

  // ===== ADD TO CART =====
  document.getElementById('productAddCart').addEventListener('click', () => {
    addToCart(p.id, qty);
  });

  // ===== WISHLIST TOGGLE =====
  const wishlistBtn = document.getElementById('productWishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      const icon = wishlistBtn.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-regular');
        icon.classList.toggle('fa-solid');
        
        if (icon.classList.contains('fa-solid')) {
          wishlistBtn.style.color = '#e00';
          wishlistBtn.childNodes[1].textContent = ' Added to wishlist'; 
        } else {
          wishlistBtn.style.color = '';
          wishlistBtn.childNodes[1].textContent = ' Add to wishlist';
        }
      }
    });
  }

  // ===== TABS =====
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ===== RELATED PRODUCTS =====
  const related = products
    .filter(prod => prod.id !== p.id && (prod.category === p.category || prod.subCategory === p.subCategory))
    .slice(0, 4);
  renderRelatedGrid('relatedGrid', related);

  // ===== RECENTLY VIEWED =====
  saveRecentlyViewed(p.id);
  const recentIds = getRecentlyViewed().filter(id => id !== p.id);
  const recent = recentIds.map(id => products.find(prod => prod.id === id)).filter(Boolean).slice(0, 4);
  renderRelatedGrid('recentGrid', recent);
}

// ===== RENDER RELATED GRID =====
function renderRelatedGrid(containerId, items) {
  const grid = document.getElementById(containerId);
  if (!grid) return;

  if (items.length === 0) {
    grid.closest('.related-section').style.display = 'none';
    return;
  }

  grid.innerHTML = '';
  items.forEach(p => {
    const isVideo = p.image && (p.image.endsWith('.mp4') || p.image.endsWith('.webm'));
    const mediaTag = isVideo
      ? `<video src="${p.image}" autoplay muted loop playsinline></video>`
      : `<img src="${p.image}" alt="${p.name}" />`;

    const card = document.createElement('a');
    card.href = `product.html?id=${p.id}`;
    card.className = 'related-card';
    card.innerHTML = `
      <div class="related-card-img">
        ${p.discount ? `<span class="related-card-badge">${p.discount}%</span>` : ''}
        ${mediaTag}
      </div>
      <p class="related-card-name">${p.name}</p>
      <div class="related-card-prices">
        <span class="related-sale">$${p.salePrice.toFixed(2)}</span>
        ${p.discount > 0 ? `<span class="related-original">$${p.price.toFixed(2)}</span>` : ''}
      </div>
      <div class="related-stars">
        ${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}
        <span>(${p.reviews})</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ===== RECENTLY VIEWED (localStorage) =====
function saveRecentlyViewed(id) {
  let recent = JSON.parse(localStorage.getItem('nurfia_recent') || '[]');
  recent = [id, ...recent.filter(i => i !== id)].slice(0, 8);
  localStorage.setItem('nurfia_recent', JSON.stringify(recent));
}
function getRecentlyViewed() {
  return JSON.parse(localStorage.getItem('nurfia_recent') || '[]');
}