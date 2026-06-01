import products from './api/products.json';
import { addToCart } from './cart.js'; 

// Color name map
const colorNames = {
  '#000000': 'Black', '#FFFFFF': 'White', '#808080': 'Gray',
  '#FF0000': 'Red', '#0000FF': 'Blue', '#90EE90': 'Green',
  '#8B4513': 'Brown', '#FFA500': 'Orange', '#FFD700': 'Yellow',
  '#87CEEB': 'Blue', '#556B2F': 'Green', '#8B008B': 'Purple',
  '#F5DEB3': 'Beige', '#AED6F1': 'Blue', '#FFB6C1': 'Pink',
  '#8B0000': 'Red', '#FFFACD': 'Yellow', '#E8A090': 'Pink'
};

// Global Filtering State
let filtered = [...products];
let currentPage = 1;
let itemsPerPage = 12;
let activeCategory = 'all';
let activeColors = [];
let activeSizes = [];
let maxPrice = 150;
let sortBy = 'default';
let isGridView = true;
let activeStockFilter = 'all'; // 'all', 'in-stock', 'out-of-stock'
let searchQuery = '';

// ===== BUILD FILTERS DYNAMICALLY FROM JSON =====

// 1. Categories Filter Setup
const categories = ['all', ...new Set(products.map(p => p.subCategory).filter(Boolean))];
const categoryList = document.getElementById('categoryList');
if (categoryList) {
  categoryList.innerHTML = '';
  categories.forEach(cat => {
    const li = document.createElement('li');
    const count = cat === 'all' ? products.length : products.filter(p => p.subCategory === cat).length;
    li.innerHTML = `<a href="#" data-cat="${cat}" class="${cat === 'all' ? 'active' : ''}">${cat === 'all' ? 'All' : cat} <span>${count}</span></a>`;
    li.querySelector('a').addEventListener('click', (e) => {
      e.preventDefault();
      activeCategory = cat;
      categoryList.querySelectorAll('a').forEach(a => a.classList.remove('active'));
      e.currentTarget.classList.add('active');
      currentPage = 1;
      applyFilters();
    });
    categoryList.appendChild(li);
  });
}

// 2. Colors Filter Setup
const allColors = [...new Set(products.flatMap(p => p.colors || []).filter(Boolean))];
const colorList = document.getElementById('colorList');
if (colorList) {
  colorList.innerHTML = '';
  allColors.forEach(color => {
    const name = colorNames[color] || color;
    const count = products.filter(p => p.colors && p.colors.includes(color)).length;
    const li = document.createElement('li');
    li.innerHTML = `
      <label style="cursor:pointer;">
        <input type="checkbox" value="${color}" />
        <span class="color-dot" style="background:${color}; border: 1px solid #ddd; display:inline-block; width:12px; height:12px; border-radius:50%; margin:0 5px;"></span>
        ${name} <span>(${count})</span>
      </label>`;
    li.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) activeColors.push(color);
      else activeColors = activeColors.filter(c => c !== color);
      currentPage = 1;
      applyFilters();
    });
    colorList.appendChild(li);
  });
}

// 3. Sizes Filter Setup
const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const sizeList = document.getElementById('sizeList');
if (sizeList) {
  sizeList.innerHTML = '';
  allSizes.forEach(size => {
    const count = products.filter(p => p.sizes && p.sizes.includes(size)).length;
    const li = document.createElement('li');
    li.innerHTML = `
      <label style="cursor:pointer;">
        <input type="checkbox" value="${size}" />
        ${size} <span>(${count})</span>
      </label>`;
    li.querySelector('input').addEventListener('change', (e) => {
      if (e.target.checked) activeSizes.push(size);
      else activeSizes = activeSizes.filter(s => s !== size);
      currentPage = 1;
      applyFilters();
    });
    sizeList.appendChild(li);
  });
}

// 4. Price Range Slider Setup
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
if (priceRange && priceValue) {
  priceRange.addEventListener('input', () => {
    priceValue.textContent = priceRange.value;
  });
  const applyPriceBtn = document.getElementById('applyPrice');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      maxPrice = parseInt(priceRange.value);
      currentPage = 1;
      applyFilters();
    });
  }
}

// 5. Stock Status Filters Setup (FIXED & FUNCTIONAL)
const stockFilterContainer = document.getElementById('stockFilters') || document.querySelector('.widget-stock');
if (stockFilterContainer) {
  // Compute true live metrics from JSON data
  const totalInStock = products.filter(p => p.stock > 0).length;
  const totalOutOfStock = products.filter(p => p.stock === 0).length;

  stockFilterContainer.innerHTML = `
    <h3 class="widget-title">Availability</h3>
    <ul class="stock-list-container">
      <li><label><input type="radio" name="stockStatus" value="all" checked /> All Products <span>(${products.length})</span></label></li>
      <li><label><input type="radio" name="stockStatus" value="in-stock" /> In Stock <span>(${totalInStock})</span></label></li>
      <li><label><input type="radio" name="stockStatus" value="out-of-stock" /> Out of Stock <span>(${totalOutOfStock})</span></label></li>
    </ul>
  `;

  stockFilterContainer.querySelectorAll('input[name="stockStatus"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      activeStockFilter = e.target.value;
      currentPage = 1;
      applyFilters();
    });
  });
}

// 6. Search Bar Integration (FUNCTIONAL)
const searchInput = document.getElementById('shopSearchInput') || document.querySelector('.sidebar-search input');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    currentPage = 1;
    applyFilters();
  });
}

// 7. Top Bar Controls (Sorting and Display limits)
document.getElementById('sortSelect')?.addEventListener('change', (e) => {
  sortBy = e.target.value;
  applyFilters();
});

document.getElementById('itemsSelect')?.addEventListener('change', (e) => {
  itemsPerPage = parseInt(e.target.value);
  currentPage = 1;
  applyFilters();
});

// View Layout Toggles
document.getElementById('gridView')?.addEventListener('click', () => {
  isGridView = true;
  document.getElementById('shopGrid')?.classList.remove('list-view');
  document.getElementById('gridView')?.classList.add('active');
  document.getElementById('listView')?.classList.remove('active');
});

document.getElementById('listView')?.addEventListener('click', () => {
  isGridView = false;
  document.getElementById('shopGrid')?.classList.add('list-view');
  document.getElementById('listView')?.classList.add('active');
  document.getElementById('gridView')?.classList.remove('active');
});


// ===== ENGINE: COMPREHENSIVE FILTER EVALUATION =====
function applyFilters() {
  filtered = products.filter(p => {
    // Category sorting matching rule
    const catMatch = activeCategory === 'all' || p.subCategory === activeCategory;
    
    // Multiple Checkbox tracking logic rules
    const colorMatch = activeColors.length === 0 || (p.colors && activeColors.some(c => p.colors.includes(c)));
    const sizeMatch = activeSizes.length === 0 || (p.sizes && activeSizes.some(s => p.sizes.includes(s)));
    
    // Exact Pricing checking conditions
    const currentPrice = p.salePrice !== undefined ? p.salePrice : p.price;
    const priceMatch = currentPrice <= maxPrice;
    
    // Stock Status conditions (Calculated completely from JSON properties)
    let stockMatch = true;
    if (activeStockFilter === 'in-stock') stockMatch = p.stock > 0;
    if (activeStockFilter === 'out-of-stock') stockMatch = p.stock === 0 || !p.stock;
    
    // Text search query filtering rules
    const searchMatch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery) || (p.description && p.description.toLowerCase().includes(searchQuery));

    return catMatch && colorMatch && sizeMatch && priceMatch && stockMatch && searchMatch;
  });

  // Sorting Handler Configurations
  if (sortBy === 'price-low') filtered.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
  else if (sortBy === 'price-high') filtered.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
  else if (sortBy === 'rating') filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sortBy === 'discount') filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0));

  renderProducts();
  renderPagination();
}


// ===== DOM ACTION: RENDERING SYSTEM =====
function renderProducts() {
  const grid = document.getElementById('shopGrid');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="no-results-alert" style="padding: 60px 0; text-align: center; width: 100%; grid-column: 1 / -1;">
                        <h3>No products match your current filtering criteria.</h3>
                        <p style="color:#777; margin-top:10px;">Try expanding your price boundaries or deselecting filter checkmarks.</p>
                      </div>`;
    document.getElementById('resultCount').textContent = "Showing 0 results";
    return;
  }

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginated = filtered.slice(start, end);

  document.getElementById('resultCount').textContent =
    `Showing ${start + 1}–${Math.min(end, filtered.length)} of ${filtered.length} results`;

  grid.innerHTML = paginated.map(p => `
    <div class="shop-card" data-id="${p.id}" style="cursor: pointer;">
      <div class="shop-card-img">
        ${p.discount ? `<span class="shop-badge">${p.discount}%</span>` : ''}
        ${p.video
          ? `<video src="${p.video}" autoplay muted loop playsinline></video>`
          : `<img src="${p.image}" alt="${p.name}" />`
        }
        <div class="shop-card-actions">
          <button class="shop-action-btn shop-wishlist" title="Wishlist"><i class="fa-regular fa-heart"></i></button>
          <button class="shop-action-btn" title="Compare"><i class="fa-solid fa-arrow-right-arrow-left"></i></button>
          <button class="shop-action-btn" title="Quick View"><i class="fa-regular fa-eye"></i></button>
        </div>
        ${p.stock > 0 
          ? `<button class="shop-add-cart">ADD TO CART</button>` 
          : `<button class="shop-add-cart out-of-stock-btn" disabled style="background:#888; color:#ccc; cursor:not-allowed;">OUT OF STOCK</button>`
        }
      </div>
      <div class="shop-card-info">
        <p class="shop-card-name">${p.name}</p>
        <div class="shop-card-prices">
          <span class="shop-sale-price">$${p.salePrice.toFixed(2)}</span>
          <span class="shop-original-price">$${p.price.toFixed(2)}</span>
        </div>
        <div class="shop-card-rating">
          <span class="stars">${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</span>
          <span>(${p.reviews})</span>
        </div>
      </div>
    </div>
  `).join('');

  // Bind individual element interactors cleanly
  grid.querySelectorAll('.shop-card').forEach(card => {
    const productId = parseInt(card.dataset.id);

    // Dynamic Redirection to Detail Page
    card.addEventListener('click', () => {
      window.location.href = `product.html?id=${productId}`;
    });

    // Add to Cart Button Interceptor
    const cartBtn = card.querySelector('.shop-add-cart:not([disabled])');
    if (cartBtn) {
      cartBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        addToCart(productId);
      });
    }

    // Interactive Favorite/Wishlist Toggle
    const wishlistBtn = card.querySelector('.shop-wishlist');
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        const icon = wishlistBtn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-regular');
          icon.classList.toggle('fa-solid');
          wishlistBtn.style.color = icon.classList.contains('fa-solid') ? '#e00' : '';
        }
      });
    }
  });
}


// ===== NAV: PAGINATION ENGINE =====
function renderPagination() {
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const pagination = document.getElementById('shopPagination');
  if (!pagination) return;

  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} id="prevPage">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">›</button>`;
  pagination.innerHTML = html;

  pagination.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      applyFilters();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; applyFilters(); }
  });
  document.getElementById('nextPage')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; applyFilters(); }
  });
}

// Initial Initialization Run
applyFilters();